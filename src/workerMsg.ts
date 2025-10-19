export interface CanvasMsg {
  type: "Canvas";
  data: OffscreenCanvas;
}

export interface VideoFileMsg {
  type: "Video";
  data: File;
}

export interface ReplayMsg {
  type: "Replay";
  data: null;
}

export interface PlayPauseMsg {
  type: "PlayPause";
  data: null;
}

export interface ResizeMsg {
  type: "Resize";
  data: {width: number, height: number};
}

export type WorkerMsg = CanvasMsg | VideoFileMsg | ReplayMsg | PlayPauseMsg | ResizeMsg

export const worker: { deref?: Worker } = {};
export const setWorker = (newWorker: Worker) => {
  worker.deref = newWorker;
};