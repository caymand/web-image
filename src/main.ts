import * as MP4BOX from "mp4box"
import type { CanvasMsg } from "./workerMsg";

const canvas: HTMLCanvasElement = document.getElementById("canvas") as HTMLCanvasElement;
const offScreenCanvas = canvas.transferControlToOffscreen();

const renderWorker = new Worker(new URL("./rendererWorker.ts", import.meta.url), { type: "module" });
const msg: CanvasMsg = { data: offScreenCanvas, type: "Canvas" }
renderWorker.postMessage(msg, [offScreenCanvas]);

renderWorker.onmessage = (ev) => {
  console.log(ev.data);
};

const inputFile = document.getElementById("input")
const getFile = new Promise<File>((resolve, reject) => {
  function onChooseFile(e: Event) {
    const videoFiles = (e.target as HTMLInputElement).files;
    if (!videoFiles) {
      return;
    }
    const videoFile = videoFiles[0];
    resolve(videoFile);
  }
  inputFile?.addEventListener("change", onChooseFile)
});

getFile.then((file) => {
  renderWorker.postMessage({ type: "Video", data: file })
});

