import { useCallback, useEffect, useRef } from "react";
import { worker, type CanvasMsg, type ResizeMsg } from "./workerMsg";
import style from "./controls.module.css"

export const DrawingSurface: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasTransferred = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const onResize = useCallback(() => {
    if (containerRef.current) {
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      if (worker.deref) {
        const msg: ResizeMsg = { type: "Resize", data: { width, height } };
        worker.deref.postMessage(msg)
      }
    }
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
      renderWorker.postMessage("foo");
    }

    if (canvasRef.current && !canvasTransferred.current) {
      const offScreenCanvas = canvasRef.current.transferControlToOffscreen();
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
      <canvas ref={canvasRef}></canvas>
    </div>
  </>

}