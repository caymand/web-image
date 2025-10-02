import * as MP4BOX from "mp4box"

const canvas: HTMLCanvasElement = document.getElementById("canvas") as HTMLCanvasElement;
if (!canvas) {
  console.error("Could not get canvas");
}
const ctx = canvas.getContext("2d");
ctx?.fillText("Hello World", 10, 50);
ctx?.clearRect(0, 0, canvas.width, canvas.height);

const inputFile = document.getElementById("input")

const getFile = new Promise<ArrayBuffer>((resolve, reject) => {
  function onChooseFile(e: Event) {
    const videoFiles = (e.target as HTMLInputElement).files;
    if (!videoFiles) {
      return;
    }
    const viodeFile = videoFiles[0];

    const fileReader = new FileReader();
    fileReader.onload = (ev) => {
      const buf = ev.target?.result as ArrayBuffer;
      resolve(buf)
    }
    fileReader.readAsArrayBuffer(viodeFile)
  }
  inputFile?.addEventListener("change", onChooseFile)
})

function handleFrame(frame: VideoFrame) {
  ctx?.drawImage(frame, 0, 0, canvas.width, canvas.height);
  frame.close();
}

const mp4box = MP4BOX.createFile();
const videoDecoderInit: VideoDecoderInit = {
  output: handleFrame,
  error: (e) => console.log(e.message)
}
const videoDecoder = new VideoDecoder(videoDecoderInit);
mp4box.onReady = (info) => {
  const videoTrack = info.tracks[0];
  mp4box.setExtractionOptions(videoTrack.id, "video", { nbSamples: 1 })

  mp4box.onSamples = (id, user, samples) => {
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
    videoDecoder.decode(chunk);
  }

  const config: VideoDecoderConfig = { 
    codedHeight: videoTrack.track_height, 
    codedWidth: videoTrack.track_width, 
    codec: videoTrack.codec 
  }
  // VideoDecoder.isConfigSupported(config).then((supported) => {
  //   console.assert(supported.supported);
  //   
  // });
  videoDecoder.configure(config);
  mp4box.start();
  mp4box.flush();

}


getFile.then((buf) => {
  const buffer = MP4BOX.MP4BoxBuffer.fromArrayBuffer(buf, 0);
  mp4box.appendBuffer(buffer);
});

