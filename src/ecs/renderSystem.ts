import { Components, getComponent, queryEntities } from "./components";
import { newPoint } from "../annotations";
import { linearAnimation } from "./animationSystem";

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

function renderPointsSystem(time: number) {
  const animationPoints = Components.POINT | Components.ANIMATION;
  const pointsComponent = queryEntities(animationPoints);
  if (pointsComponent === null) {
    return;
  }

  const pointComp = getComponent(pointsComponent, Components.POINT);
  const animationComp = getComponent(pointsComponent, Components.ANIMATION);
  for (let i = 0; i < pointsComponent.entities.length; i++) {
    const x = pointComp[i * 3];
    const y = pointComp[i * 3 + 1];
    const finalRadius = pointComp[i * 3 + 2];
    const animationProgress = animationComp[i].value;

    const radius = finalRadius * animationProgress;

    // TODO(k): Here we render all points? Do we always want that?
    if (radius !== finalRadius) {
      const ctx = renderState!.ctx;
      ctx.fillStyle = "#ff00ff";
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, 2 * Math.PI, true);
      ctx.fill();
    }
  }
}

function loop(time: number) {
  linearAnimation(time);
  renderPointsSystem(time);

  renderState!.currentTime = time;
  requestAnimationFrame(loop);
}


// TODO(k): move this out of the render system.
// They should probably go into the inputSystem.
function mouseDown(ev: MouseEvent) {
  newPoint(0, ev.x, ev.y, 10);
  renderState!.isDirty = true;
}

function setupInputHandlers(canvas: HTMLCanvasElement) {
  // TODO(k): Handlers for these events should be all we need for 
  // drawing.
  canvas.onmousemove;
  canvas.onmousedown = mouseDown
  canvas.onmouseup;
}

export { loop as renderLoop };