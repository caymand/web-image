import type { WorkerMsg } from "./workerMsg";
import * as MP4Box from "mp4box";

interface RenderState {
  videoFile?: File;
  videoOffset: number;
  videoSamplingStarted: boolean;
  videoDecoder: VideoDecoder;

  framesInFlight: Array<VideoFrame>;
  frameUnderFlow: boolean;

  canvas?: OffscreenCanvas;
  canvasCtx?: OffscreenCanvasRenderingContext2D;
}

const FRAME_BUDGET = 1000 / 30;
const MAX_FRAMES_IN_FLIGHT = 5;
const MIN_FRAMES_IN_FLIGHT = 2;
const chunkSize = 16 << 10; // 16KB chunk sizes
const videoDecoderInit: VideoDecoderInit = {
  output: handleVideoFrame,
  error: (e) => console.log(e.message)
}
const renderState: RenderState = {
  framesInFlight: new Array(),
  videoDecoder: new VideoDecoder(videoDecoderInit),
  frameUnderFlow: true,
  videoSamplingStarted: false,
  videoOffset: 0,
}

/** Global message pipe */
onmessage = (ev) => {
  const { type, data } = ev.data as WorkerMsg
  switch (type) {
    case "Canvas": {
      const canvas = data;
      const ctx = canvas.getContext("2d");
      renderState.canvas = canvas
      renderState.canvasCtx = ctx!;
      ctx?.clearRect(0, 0, canvas.width, canvas.height)
      break;
    }
    case "Video": {
      const file = data;
      renderState.videoFile = file;
      readFile(file, 0);
      break;
    }
    case "Replay": {
      doReplay();
      break;
    }
    default:
      console.error("Unknown message:", ev.data);
  }
  postMessage("Handle event")
}

/** MP4Box setup */
function init_mp4box() {
  let mp4box = MP4Box.createFile();

  mp4box.onSamples = onVideoSample
  mp4box.onReady = onMoovParsed

  return mp4box;
}
let mp4box = init_mp4box();

function doReplay() {
  if (renderState.videoFile === undefined) {
    return;
  }
  // Clear all state.
  mp4box.stop();
  mp4box.flush();
  renderState.videoDecoder.reset();
  renderState.framesInFlight.splice(
    0, renderState.framesInFlight.length
  );
  const { width, height } = renderState.canvas!;
  renderState.canvasCtx?.clearRect(0, 0, width, height);

  // Redo frame extraction and processing.
  mp4box = init_mp4box();
  readFile(renderState.videoFile, 0);
}

function onVideoSample(_id: number, _user: unknown, samples: MP4Box.Sample[]) {
  const sample = samples[0];
  if (sample.data === undefined) {
    return;
  }
  renderState.videoSamplingStarted = true;
  const chunk = new EncodedVideoChunk({
    data: sample!.data,
    type: sample.is_sync ? "key" : "delta",
    duration: sample.duration,
    timestamp: sample.dts
  })

  renderState.videoDecoder.decode(chunk);
}

function onMoovParsed(info: MP4Box.Movie) {
  const videoTrack = info.tracks[0];

  const config: VideoDecoderConfig = {
    codedHeight: videoTrack.track_height,
    codedWidth: videoTrack.track_width,
    codec: videoTrack.codec
  }

  renderState.videoDecoder.configure(config);

  mp4box.setExtractionOptions(videoTrack.id, videoTrack, { nbSamples: 1 })
  mp4box.start();
}

function readChunk(file: File, chunkSize: number, offset: number) {
  const chunkBlob = file.slice(offset, offset + chunkSize);
  const chunk = chunkBlob.arrayBuffer();

  return chunk
}


/** TODO(k): Memory of each sample should be freed, if it does not
 * do so automatically?
 */
async function readFile(file: File, offset: number) {
  if (offset >= file.size) {
    mp4box.flush();
    return;
  }

  const chunk = await readChunk(file, chunkSize, offset);
  const buffer = MP4Box.MP4BoxBuffer.fromArrayBuffer(chunk, offset);
  const nextOffset = mp4box.appendBuffer(buffer);
  renderState.videoOffset = nextOffset;

  // Schedule next chunk processing to avoid blocking the event loop
  if (!renderState.videoSamplingStarted) {
    setTimeout(() => readFile(file, nextOffset), 0);
  }
}

/** Producer */
function handleVideoFrame(frame: VideoFrame) {
  renderState.framesInFlight.push(frame)
  if (renderState.frameUnderFlow) {
    renderState.frameUnderFlow = false;
    setTimeout(renderLoop, 0);
  }
}

/** Consumer */
/** TODO: I don't think this exactly matches the FPS Target.
 */
function renderLoop() {
  const undhandledFrames = renderState.framesInFlight.length;
  if (undhandledFrames < MIN_FRAMES_IN_FLIGHT) {
    renderState.videoSamplingStarted = false;
    setTimeout(() =>
      readFile(renderState.videoFile!, renderState.videoOffset),
      0
    );
  }
  if (undhandledFrames < 1) {
    renderState.frameUnderFlow = true;
    return;
  }

  const workStart = performance.now();
  const frame = renderState.framesInFlight.shift()!;
  const { width, height } = renderState.canvas!;
  renderState.frameUnderFlow = false;
  renderState.canvasCtx?.drawImage(frame, 0, 0, width, height);
  frame.close();

  // Calculate how long the work took and wait for the remainder of the frame budget.
  const workEnd = performance.now();
  const workDuration = workEnd - workStart;
  const nextFrameDelay = FRAME_BUDGET - workDuration;

  setTimeout(renderLoop, nextFrameDelay);
}
