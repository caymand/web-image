
import { GetComponent, GetEntitiesWithComponent } from "./EntityManager";

import { Components, type Vec2 } from "./Components";


import { linearAnimation } from "./animationSystem";
import { updateLine } from "./annotationsSystem";

interface RenderState {
  ctx: CanvasRenderingContext2D;
  isDirty: boolean;
  dims: Vec2;

  currentTime: number;
}

function newRenderState(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): RenderState {
  return {
    ctx,
    dims: {x: canvas.width, y: canvas.width},
    isDirty: false,
    currentTime: 0,
  }
}

let renderState: RenderState | null = null;

export function windowWasResized(newX: number, newY: number) {
  renderState!.dims.x = newX;
  renderState!.dims.y = newY;
}

export function initRenderState(canvas: HTMLCanvasElement) {
  if (renderState === null) {
    const ctx = canvas.getContext("2d")!;
    renderState = newRenderState(canvas, ctx);
    return;
  }
  throw new DOMException("Cannot init renderer more than once.");
}

export function clearRenderState() {
  renderState = null;
}

function renderPointsSystem(time: number) {
  const animationPoints = Components.POINT | Components.ANIMATION | Components.SIZE;

  const entities = GetEntitiesWithComponent(animationPoints);
  for (let i = 0; i < entities.length; i++) {
    const entity = entities[i];

    const point = GetComponent(entity, Components.POINT);
    const finalRadius = GetComponent(entity, Components.SIZE);
    const animation = GetComponent(entity, Components.ANIMATION);

    const animationProgress = animation.value;
    const radius = finalRadius * animationProgress;

    const centerX = point.x - finalRadius;
    const centerY = point.y - finalRadius;

    // TODO(k): Here we render all points? Do we always want that?
    const ctx = renderState!.ctx;
    ctx.fillStyle = "#ff00ff";
    ctx.beginPath()
    ctx.arc(centerX, centerY, Math.min(radius, finalRadius), 0, 2 * Math.PI, true);
    ctx.fill();

  }
}

function lineRendering(time: number) {
  const lines = GetEntitiesWithComponent(Components.LINE_SEGMENT | Components.SIZE | Components.SELECTABLE);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineSegment = GetComponent(line, Components.LINE_SEGMENT);
    const thickness = GetComponent(line, Components.SIZE);
    const selected = GetComponent(line, Components.SELECTABLE);
    const { p1, p2 } = lineSegment;

    const canvasCtx = renderState!.ctx;
    canvasCtx.lineWidth = thickness;
    canvasCtx.strokeStyle = "red";
    canvasCtx.beginPath();
    canvasCtx.moveTo(p1.x, p1.y);
    canvasCtx.lineTo(p2.x, p2.y);
    canvasCtx.stroke();
  }
}

function loop(time: number) {
  const ctx = renderState!.ctx;
  const dims = renderState!.dims;
  ctx.clearRect(0, 0, dims.x, dims.y);
  updateLine();

  linearAnimation(time);
  // renderPointsSystem(time);
  lineRendering(time);

  renderState!.currentTime = time;
  requestAnimationFrame(loop);
}

export { loop as renderLoop };