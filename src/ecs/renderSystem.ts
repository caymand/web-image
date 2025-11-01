import { Components, getComponent, newPoint, queryObjects } from "./components";

interface RenderState {
  ctx: CanvasRenderingContext2D;  
  isDirty: boolean;

  currentTime: number;
}

function newRenderState(ctx: CanvasRenderingContext2D): RenderState {
  return {
    ctx,
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

    let nextRadius: number;

    if (animationProgress > 0) {
      const dt = time - renderState!.currentTime;
      nextRadius = dt * growFactor + radius;
      const remainingAnimation = Math.max(0, animationProgress - dt);      
      animationComp[i] = remainingAnimation / animationDuration;    
      pointComp[i * 3 + 2] = nextRadius;      
    } else {
      nextRadius = radius;
    }    

    // TODO(k): Here we render all points? Do we always want that?
    const ctx = renderState!.ctx;
    ctx.fillStyle = "#ff00ff";
    ctx.beginPath()
    ctx.arc(x, y, nextRadius, 0, 2 * Math.PI, true);
    ctx.fill();
  }
  renderState!.currentTime = time;
}

function loop(time: number) {
  if (renderState!.isDirty) {
    renderPointsSystem(time);
  }
  requestAnimationFrame(loop);
}

export { loop as renderLoop };