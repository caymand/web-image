import { Components, GetComponent, GetEntitiesWithComponent } from "./EntityManager";

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

function loop(time: number) {
  linearAnimation(time);
  renderPointsSystem(time);

  renderState!.currentTime = time;
  requestAnimationFrame(loop);
}

export { loop as renderLoop };