import * as UI from "./controls";

const container = document.getElementById('container')!;
UI.createRoot(container);
const videoControlsBox = UI.addContainer();
UI.videoControls(videoControlsBox);