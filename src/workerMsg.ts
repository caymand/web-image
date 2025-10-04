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

export type WorkerMsg = CanvasMsg | VideoFileMsg | ReplayMsg
