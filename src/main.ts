import * as UI from "./controls";

const root = document.getElementById('container')!;
UI.createRoot(root);

const stepButtonsBox = UI.addContainer();


const videoControlsBox = UI.addContainer();
UI.equipContainer(videoControlsBox)
UI.videoInput();
UI.replayButton();
UI.playPause();
UI.endContainer();

  