import type { WorkerMsg } from "./workerMsg";
import * as MP4Box from "mp4box";

interface RenderState {
  videoFile?: File;
  videoOffset: number;
  consumingVideoFrames: boolean;
  videoDecoder: VideoDecoder;

  frameBudget_ms: number;

  frameStart: number;

  isPaused: boolean;

  framesInFlight: Array<VideoFrame>;
  frameUnderFlow: boolean;

  canvas?: OffscreenCanvas;
  canvasCtx?: OffscreenCanvasRenderingContext2D;
}

const MIN_FRAMES_IN_FLIGHT = 1;
const CHUNK_SIZE = 16 << 10; // 16KB chunk sizes

const videoDecoderInit: VideoDecoderInit = {
  output: handleVideoFrame,
  error: (e) => console.log(e.message)
}
const renderState: RenderState = {
  framesInFlight: [],
  videoDecoder: new VideoDecoder(videoDecoderInit),
  frameUnderFlow: true,
  isPaused: false,
  consumingVideoFrames: false,
  videoOffset: 0,
  frameStart: 0,
  frameBudget_ms: 1000 / 30 // 30fps default,
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
    case "PlayPause": {
      if (renderState.isPaused) {
        renderState.isPaused = false;
        setTimeout(renderLoop, 0);
      } else {
        renderState.isPaused = true;
      }
      break;
    }
    case "Resize": {      
      renderState.canvas!.width = data.width;
      renderState.canvas!.height = data.height;
      break;
    }
    default:
      console.error("Unknown message:", ev.data);
  }
  postMessage("Handle event")
}

/** MP4Box setup */
function init_mp4box() {
  const mp4box = MP4Box.createFile();

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

/** TODO(k): Think about the scenario where the video decoder gets full of frames,
 * because the frames are not consumed fast enough.
 * Drop frames? 
 */
function onVideoSample(_id: number, _user: unknown, samples: MP4Box.Sample[]) {
  const sample = samples[0];

  if (sample.data === undefined) {
    return;
  }

  const chunk = new EncodedVideoChunk({
    data: sample.data,
    type: sample.is_sync ? "key" : "delta",
    duration: sample.duration,
    timestamp: sample.dts
  })

  renderState.videoDecoder.decode(chunk);
  mp4box.releaseUsedSamples(sample.track_id, sample.number);
}

function onMoovParsed(info: MP4Box.Movie) {
  const videoTrack = info.videoTracks[0];

  // time for a single frame
  const avgSampleDuration = info.duration / videoTrack.nb_samples;  
  renderState.frameBudget_ms = Math.round(avgSampleDuration);

  // get the trak box associated with the vdeo stram
  const trak = mp4box.getTrackById(videoTrack.id);
  // traverse the boxes until the sample desciption box.
  const stsd = trak.mdia.minf.stbl.stsd;
  // I know it is a video and I can therefore do like this
  const boxEntry = stsd.entries[0] as MP4Box.VisualSampleEntry;

  let config: VideoDecoderConfig | null = null;
  // Match the box type to get the decode info
  if (boxEntry.avcC !== undefined) {
    const avcC = boxEntry.avcC;
    const stream = new MP4Box.MultiBufferStream();
    avcC.write(stream);

    // Skip the header of the AVC Decoder configuration record
    // Default to 8 if the hdr_size is not set.
    const extraData = stream.buffer.slice(avcC.hdr_size ?? 8);

    //TODO: look at nb_samples - this gives me the number of frames.
    config = {
      codedHeight: videoTrack.track_height,
      codedWidth: videoTrack.track_width,
      codec: videoTrack.codec,
      description: extraData,
    }

  }
  if (config === null) {
    return;
  }
  renderState.videoDecoder.configure(config);

  mp4box.setExtractionOptions(videoTrack.id, videoTrack, { nbSamples: 1 });
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

  const chunk = await readChunk(file, CHUNK_SIZE, offset);
  const buffer = MP4Box.MP4BoxBuffer.fromArrayBuffer(chunk, offset);
  const nextOffset = mp4box.appendBuffer(buffer);
  renderState.videoOffset = nextOffset;

  // Keep reading chunks until the video decoder starts producing frames.
  if (!renderState.consumingVideoFrames) {
    setTimeout(() => readFile(file, nextOffset), 0);
  }
}

/** Producer */
function handleVideoFrame(frame: VideoFrame) {
  renderState.consumingVideoFrames = true;
  renderState.framesInFlight.push(frame)
  if (renderState.frameUnderFlow) {
    renderState.frameUnderFlow = false;
    setTimeout(renderLoop, 0);
  }
}

function beginFrame() {
  renderState.frameStart = performance.now();
  const undhandledFrames = renderState.framesInFlight.length;
  if (undhandledFrames <= MIN_FRAMES_IN_FLIGHT) {
    renderState.consumingVideoFrames = false;
    setTimeout(() =>
      readFile(renderState.videoFile!, renderState.videoOffset),
      0
    );
  }

  return undhandledFrames;
}
function endFrame() {
  const frameEnd = performance.now();
  const workDuration = frameEnd - renderState.frameStart;
  const nextFrameDelay = renderState.frameBudget_ms - workDuration;

  setTimeout(renderLoop, nextFrameDelay);
}

/** Consumer 
 * Tries to process as many frames in flight as possible.
 * In case the frame buffer underflows, the renderLoop needs to
 * be rescheduled again bye the video frame handler.
*/
function renderLoop() {
  if (renderState.isPaused) {
    return;
  }
  // FRAME BEGIN
  const undhandledFrames = beginFrame();

  if (undhandledFrames < 1) {
    renderState.frameUnderFlow = true;
    return;
  }
  const frame = renderState.framesInFlight.shift()!;

  const { width, height } = renderState.canvas!;
  renderState.frameUnderFlow = false;
  renderState.canvasCtx?.drawImage(frame, 0, 0, width, height);
  frame.close();

  // FRAME END
  endFrame();
}
