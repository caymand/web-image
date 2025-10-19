import styles from './controls.module.css';
import { PlayPause, Replay, SelectVideo } from './VideoControls';
import { DrawingSurface } from './DrawingSurface';
 

function App() {
  return (
    <div id="container" >
      <DrawingSurface />      
      <div className={styles.controlsContainer}>
        <SelectVideo />
        <PlayPause />
        <Replay />
      </div>
    </div>
  );
}

export default App;
