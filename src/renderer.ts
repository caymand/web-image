import { newPoint, type Drawable } from "./drawing";

interface RenderState {
  ctx: CanvasRenderingContext2D;
  drawables: Array<Drawable>;
  isDirty: boolean;
}

function newRenderState(ctx: CanvasRenderingContext2D): RenderState {
  return {
    ctx,
    drawables: [],
    isDirty: true,
  }
}

let renderState: RenderState | null = null;

export function initRenderState(canvas: HTMLCanvasElement) {
  if (renderState === null) {
    const ctx = canvas.getContext("2d")!;
    renderState = newRenderState(ctx);
    setupInputHandlers(canvas);
    return;
  }
  throw new DOMException("Cannot init renderer more than once.");
}

export function clearRenderState() {
  renderState = null;
}

function mouseDown(ev: MouseEvent) {
  const point = newPoint(ev.x, ev.y);
}

function setupInputHandlers(canvas: HTMLCanvasElement) {
  // TODO(k): Handlers for these events should be all we need for 
  // drawing.
  canvas.onmousemove;
  canvas.onmousedown;
  canvas.onmouseup;
}

function draw(drawable: Drawable) {
}

function doLoopBody(time: number) {
  for (let i = 0; i < renderState!.drawables.length; i++) {
    const drawable = renderState!.drawables[i];
    draw(drawable);
  }
}

let radius = 10;
const endRadius = 50;
let animationDuration = 10_000;
const growFactor = (endRadius - radius) / animationDuration;
let currentTime = 0;

function loop(time: number) {
  if (renderState!.isDirty) {
    const dt = time - currentTime;
    currentTime = time;
    const nextRadius = dt * growFactor + radius;

    const ctx = renderState!.ctx;
    ctx.fillStyle = "#ff00ff";
    ctx.beginPath()
    ctx.arc(100, 100, nextRadius, 0, 2 * Math.PI, true);
    ctx.fill();

    animationDuration -= dt;
    if (animationDuration < 0) {
      renderState!.isDirty = false;
    }
    else {
      radius = nextRadius;
    }
  }
  requestAnimationFrame(loop);
}

export { loop as renderLoop };