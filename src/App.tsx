import styles from './controls.module.css';
import { PlayPause, Replay, SelectVideo } from './VideoControls';
import { DrawingSurface } from './DrawingSurface';


function App() {
  return (
    <div className={styles.app}>
      <DrawingSurface />
      <div className={styles.controlsBar}>
        <SelectVideo />
        <PlayPause />
        <Replay />
      </div>
    </div>
  );
}

export default App;
