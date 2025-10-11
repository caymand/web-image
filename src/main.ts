import * as UI from "./controls";
import styles from "./controls.module.css";

const root = document.getElementById('container')!;
UI.createRoot(root);

// Step buttons are direct children of root to be positioned over the canvas
UI.stepBackward();
UI.stepForward();

// Main controls are in their own container below the canvas
const controlsContainer = UI.addContainer();
controlsContainer.className = styles.controlsContainer;
UI.equipContainer(controlsContainer);

UI.videoInput();
UI.replayButton();
UI.playPause();

UI.endContainer();