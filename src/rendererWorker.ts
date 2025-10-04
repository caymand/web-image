import type { WorkerMsg } from "./workerMsg";
import * as MP4Box from "mp4box";

interface RenderState {
  videoDecoder: VideoDecoder;
  framesInFlight: Array<VideoFrame>;
  frameUnderFlow: boolean;
  canvas?: OffscreenCanvas;
  canvasCtx?: OffscreenCanvasRenderingContext2D;
}
const FRAME_BUDGET = 1000 / 30;
// const MAX_FRAMES_IN_FLIGHT = 2;
const chunkSize = 16 << 10; // 16KB chunk sizes
const videoDecoderInit: VideoDecoderInit = {
  output: handleVideoFrame,
  error: (e) => console.log(e.message)
}
const renderState: RenderState = {
  framesInFlight: new Array(),
  videoDecoder: new VideoDecoder(videoDecoderInit),
  frameUnderFlow: true,
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
      // Call readFile asynchronously so it doesn't block the event loop
      (async () => {
        await readFile(file);
      })();
      break;
    }
    default:
      console.error("Unknown message:", ev.data);
  }
  postMessage("Handle event")
}

/** MP4Box setup */
const mp4box = MP4Box.createFile();
mp4box.onSamples = onVideoSample
mp4box.onReady = onMoovParsed

function onVideoSample(_id: number, _user: unknown, samples: MP4Box.Sample[]) {
  const sample = samples[0];
  if (sample.data === undefined) {
    return;
  }
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

async function readFile(file: File) {
  const chunks = ((file.size + chunkSize - 1) / chunkSize) >> 0
  let offset = 0;
  for (let i = 0; i < chunks; i++) {

    // First wait for there to be resources to process more frames
    // const chunk = await getNextChunk(file, chunkSize, offset);
    const chunk = await readChunk(file, chunkSize, offset);
    const buffer = MP4Box.MP4BoxBuffer.fromArrayBuffer(chunk, offset);
    offset = mp4box.appendBuffer(buffer);
  }
  mp4box.flush();
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
async function renderLoop() {
  if (renderState.framesInFlight.length < 1) {
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
  const nextFrameDelay = Math.max(0, FRAME_BUDGET - workDuration);

  setTimeout(renderLoop, nextFrameDelay);
}
