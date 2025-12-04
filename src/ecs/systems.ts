import { updateLine } from "./annotationsSystem";
import { initInputSystem } from "./inputSystem";
import { initRenderState, renderLoop } from "./renderSystem";

export function initSystems(canvas: HTMLCanvasElement) {
  initRenderState(canvas);
  initInputSystem(canvas);
}

function mainLoop(time: number) {
  updateLine();

  renderLoop(time);
  requestAnimationFrame(mainLoop);
}

export {mainLoop as startAllSystems};