import { initInputSystem } from "./inputSystem";
import { initRenderState } from "./renderSystem";

export function initSystems(canvas: HTMLCanvasElement) {
  initRenderState(canvas);
  initInputSystem(canvas);
}