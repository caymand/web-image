import { Components, getComponent, newPoint, queryObjects, type Drawable } from "./drawing";

interface RenderState {
  ctx: CanvasRenderingContext2D;
  drawables: Array<Drawable>;
  isDirty: boolean;

  currentTime: number;
}

function newRenderState(ctx: CanvasRenderingContext2D): RenderState {
  return {
    ctx,
    drawables: [],
    isDirty: false,
    currentTime: 0,
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
  newPoint(ev.x, ev.y, radius);
  renderState!.isDirty = true;
}

function setupInputHandlers(canvas: HTMLCanvasElement) {
  // TODO(k): Handlers for these events should be all we need for 
  // drawing.
  canvas.onmousemove;
  canvas.onmousedown = mouseDown
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

const radius = 10;
const endRadius = 30;
const animationDuration = 1_000;
const growFactor = (endRadius - radius) / animationDuration;

function renderPointsSystem(time: number) {
  const animationPoints = [Components.POINT, Components.ANIMATION];
  const points = queryObjects(animationPoints);
  if (points === null) {
    return;
  }

  if (renderState!.currentTime === 0) {
    renderState!.currentTime = time;
  }

  const pointComp = getComponent(points, Components.POINT);
  const animationComp = getComponent(points, Components.ANIMATION);
  for (let i = 0; i < points.columns[Components.OBJECT].length; i++) {
    const x = pointComp[i * 3];
    const y = pointComp[i * 3 + 1];
    const radius = pointComp[i * 3 + 2];
    const animationProgress = animationComp[i] * animationDuration;

    const dt = time - renderState!.currentTime;
    renderState!.currentTime = time;
    const nextRadius = dt * growFactor + radius;

    const ctx = renderState!.ctx;
    ctx.fillStyle = "#ff00ff";
    ctx.beginPath()
    ctx.arc(x, y, nextRadius, 0, 2 * Math.PI, true);
    ctx.fill();

    const remainingAnimation = Math.max(0, animationProgress - dt);
    animationComp[i] = remainingAnimation / animationDuration;
    if (remainingAnimation <= 0) {
      renderState!.isDirty = false;
    }
    else {
      pointComp[i * 3 + 2] = nextRadius;
    }
  }

}

function loop(time: number) {
  if (renderState!.isDirty) {
    renderPointsSystem(time);
  }
  requestAnimationFrame(loop);
}

export { loop as renderLoop };