export interface CanvasMsg {
  type: "Canvas";
  data: OffscreenCanvas;
}

export interface VideoFileMsg {
  type: "Video";
  data: File;
}

export type WorkerMsg = CanvasMsg | VideoFileMsg;
