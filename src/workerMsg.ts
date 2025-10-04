export interface CanvasMsg {
  type: "Canvas";
  data: OffscreenCanvas;
}

export interface VideoFileMsg {
  type: "Video";
  data: File;
}

export interface StartMsg {
  type: "Start";
  data: {
    framerate?: number;
  };
}

export type WorkerMsg = CanvasMsg | VideoFileMsg | StartMsg;
