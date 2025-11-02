import { newPoint } from "../annotations";

interface InputSystemState {
  mouseDown: boolean;
}
const inputSystemState: InputSystemState = {
  mouseDown: false,
}

export function initInputSystem(canvas: HTMLCanvasElement) {
  canvas.onmousemove = mouseMove;
  canvas.onmousedown = mouseDown
  canvas.onmouseup = mouseUp;
}

export function deleteInputSystem() {
  // TODO: Should we delete the input handlers?
}

function mouseMove(ev: MouseEvent) {
  if (!inputSystemState.mouseDown) {
    return;
  }
}

function mouseUp(ev: MouseEvent) {
  newPoint(0, ev.x, ev.y, 10);
  inputSystemState.mouseDown = true;
}

function mouseDown(ev: MouseEvent) {
  newPoint(0, ev.x, ev.y, 10);
  inputSystemState.mouseDown = true;
}