import type { CanvasMsg, ReplayMsg } from "./workerMsg";

export interface AppControls {
  fileInput: HTMLInputElement;
  replayButton: HTMLButtonElement;
}

interface UIState {
  containers: Array<HTMLElement>;
  currentContainer: HTMLElement;
}

let uistate: UIState;

export function createRoot(rootContainer: HTMLElement) {
  const containers = new Array();
  containers.push(rootContainer);
  uistate = { currentContainer: rootContainer, containers };
}

export function equipContainer(container: HTMLElement) {
  uistate.currentContainer.appendChild(container);

  uistate.currentContainer = container;
  uistate.containers.push(container);
}

export function endContainer() {
  if (uistate.containers.length < 1) {
    return;
  }
  uistate.containers.pop();
  uistate.currentContainer = uistate.containers[uistate.containers.length - 1];
}

export function addContainer() {
  const container = document.createElement("div");
  return container;
}

export function pushElement(node: HTMLElement) {
  uistate.currentContainer.appendChild(node);
}

/** Now the actual UI components */


const canvas: HTMLCanvasElement = document.getElementById("canvas") as HTMLCanvasElement;
const offScreenCanvas = canvas.transferControlToOffscreen();

const renderWorker = new Worker(new URL("./rendererWorker.ts", import.meta.url), { type: "module" });
const msg: CanvasMsg = { data: offScreenCanvas, type: "Canvas" }
renderWorker.postMessage(msg, [offScreenCanvas]);

renderWorker.onmessage = (ev) => {
  console.log(ev.data);
};

export function button(onclick: (e: PointerEvent) => void, text: string) {
  const button = document.createElement('button');
  button.textContent = text;
  button.onclick = onclick;
  
  pushElement(button);
}

export function replayButton() {
  const replayButton = document.createElement('button');
  replayButton.id = 'replay';
  replayButton.textContent = 'Replay';

  const msg: ReplayMsg = { type: "Replay", data: null };

  replayButton.onclick = () => {
    renderWorker.postMessage(msg);
  }

  pushElement(replayButton);
}

export function videoInput() {
  const label = document.createElement('label');
  label.htmlFor = 'input';
  label.textContent = 'Select Video';
  pushElement(label);

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.id = 'input';
  fileInput.accept = 'video/*';
  pushElement(fileInput);

  const getFile = new Promise<File>((resolve) => {
    function onChooseFile(e: Event) {
      const videoFiles = (e.target as HTMLInputElement).files;
      if (!videoFiles) {
        return;
      }
      const videoFile = videoFiles[0];
      resolve(videoFile);
    }
    fileInput?.addEventListener("change", onChooseFile)
  });

  getFile.then((file) => {
    renderWorker.postMessage({ type: "Video", data: file })
  });

}

export function videoControls(container: HTMLElement) {
  equipContainer(container);
  {
    videoInput();
    replayButton();
  }
  endContainer();
}
