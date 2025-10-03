import type { WorkerMsg } from "./workerMsg";
import * as MP4Box from "mp4box";

interface RenderState {
  lastTime: number;
  videoDecoder: VideoDecoder;
  canvas?: OffscreenCanvas;
  canvasCtx?: OffscreenCanvasRenderingContext2D;
}

const videoDecoderInit: VideoDecoderInit = {
  output: renderFrame,
  error: (e) => console.log(e.message)
}

const renderState: RenderState = {
  lastTime: 0,
  videoDecoder: new VideoDecoder(videoDecoderInit),
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
      const file = data
      readFile(file);
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

function onVideoSample(id: number, user: unknown, samples: MP4Box.Sample[]) {
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
  // TODO(K): Haven't figured out how to check if the config is supported.
  // For now, we just assume it works
  // VideoDecoder.isConfigSupported(config).then((supported) => {
  //   console.assert(supported.supported);
  // });
  renderState.videoDecoder.configure(config);

  mp4box.setExtractionOptions(videoTrack.id, videoTrack, { nbSamples: 1 })
  mp4box.start();
}

function readFile(file: File) {
  const fileReader = new FileReader();
  fileReader.onload = (ev) => {
    const buf = ev.target?.result as ArrayBuffer;
    const buffer = MP4Box.MP4BoxBuffer.fromArrayBuffer(buf, 0);
    mp4box.appendBuffer(buffer);
  }
  fileReader.readAsArrayBuffer(file)
}


function renderFrame(frame: VideoFrame) {
  const { width, height } = renderState.canvas!;
  renderState.canvasCtx?.drawImage(frame, 0, 0, width, height);
  frame.close();
}