import { useCallback, useEffect, useRef } from "react";
import { worker, type CanvasMsg, type ResizeMsg } from "./workerMsg";
import style from "./controls.module.css"
import { clearRenderState, initRenderState, renderLoop } from "./renderer";

export const DrawingSurface: React.FC = () => {
  const videoCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const canvasTransferred = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const onResize = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      if (worker.deref) {
        const msg: ResizeMsg = { type: "Resize", data: { width: rect.width, height: rect.height } };
        worker.deref.postMessage(msg)
      }      
      if (drawingCanvasRef.current !== null) {
        drawingCanvasRef.current.width = rect.width;
        drawingCanvasRef.current.height = rect.height;
      }
      renderLoop(0);
    }
  }, [])

  useEffect(() => {
    if (drawingCanvasRef.current !== null) {      
      initRenderState(drawingCanvasRef.current);
    }
    return clearRenderState
  }, [])

  useEffect(() => {
    window.addEventListener("resize", onResize)

    return () => {
      window.removeEventListener("resize", onResize);
    }
  }, [onResize])

  useEffect(() => {
    if (worker.deref === undefined) {
      const renderWorker = new Worker(new URL('./rendererWorker.ts', import.meta.url), {
        type: 'module',
      });
      worker.deref = renderWorker;
    }

    if (videoCanvasRef.current && !canvasTransferred.current) {
      const offScreenCanvas = videoCanvasRef.current.transferControlToOffscreen();
      const msg: CanvasMsg = { data: offScreenCanvas, type: 'Canvas' };
      worker.deref.postMessage(msg, [offScreenCanvas]);
      canvasTransferred.current = true;
      // Set the intial size
      onResize();
    }
    return () => {
      // TODO(k): need some way to terminate the worker.
      // renderWorker.terminate();
    };
  }, [onResize]);

  return <>
    <div ref={containerRef} className={style.drawingSurface}>
      <canvas ref={videoCanvasRef}></canvas>
      <canvas ref={drawingCanvasRef}></canvas>
    </div>
  </>

}