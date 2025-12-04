import { lineSegment } from "./annotationsSystem";
import { Components } from "./Components";
import { newEntity } from "./Entity";
import { AddComponent, GetAllComponentsOfType } from "./EntityManager";

export function initInputSystem(canvas: HTMLCanvasElement) {
  canvas.onmousemove = mouseMove;
  canvas.onmousedown = mouseDown
  canvas.onmouseup = mouseUp;

  const inputEntity = newEntity();
  AddComponent(inputEntity, Components.INPUT_CONTEXT, { x: 0, y: 0, pointerDown: false });
}

export function deleteInputSystem() {
  // TODO(k): Requires deleting the entity 
}

function mouseMove(ev: MouseEvent) {
  const ctx = GetAllComponentsOfType(Components.INPUT_CONTEXT)[0];
  ctx.x = ev.x;
  ctx.y = ev.y;
}

function pointerClicked(pointerDown: boolean) {
  const ctx = GetAllComponentsOfType(Components.INPUT_CONTEXT)[0];
  ctx.pointerDown = pointerDown;
}

function mouseUp(_ev: MouseEvent) {
  pointerClicked(false);
}

function mouseDown(ev: MouseEvent) {
  pointerClicked(true);
  lineSegment({x: ev.x, y: ev.y});
}