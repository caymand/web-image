import { useRef, useEffect } from 'react';
import type { CanvasMsg } from './workerMsg';
import { worker } from './workerMsg';
import styles from './controls.module.css';
import { PlayPause, Replay, SelectVideo } from './VideoControls';

const renderWorker = new Worker(new URL('./rendererWorker.ts', import.meta.url), {
  type: 'module',
});

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasTransferred = useRef(false);

  useEffect(() => {
    if (worker.deref === undefined) {
      worker.deref = renderWorker;
      renderWorker.postMessage("foo");
    }

    if (canvasRef.current && !canvasTransferred.current) {
      const offScreenCanvas = canvasRef.current.transferControlToOffscreen();
      const msg: CanvasMsg = { data: offScreenCanvas, type: 'Canvas' };
      renderWorker.postMessage(msg, [offScreenCanvas]);
      canvasTransferred.current = true;
    }
    return () => {
      // TODO(k): need some way to terminate the worker.
      // renderWorker.terminate();
    };
  }, []);

  return (
    <div id="container">
      <canvas ref={canvasRef} width="640" height="480"></canvas>
      <div className={styles.controlsContainer}>
        <SelectVideo />
        <PlayPause />
        <Replay />
      </div>
    </div>
  );
}

export default App;
