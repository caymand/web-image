
interface RenderState {
  ctx: CanvasRenderingContext2D;
}

function newRenderState(ctx: CanvasRenderingContext2D): RenderState {
  return {
    ctx
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

function setupInputHandlers(canvas: HTMLCanvasElement) {

  // TODO(k): Handlers for these events should be all we need for 
  // drawing.
  canvas.onmousemove = (ev) => console.log(ev.pageX, ev.pageY);
  canvas.onmousedown;
  canvas.onmouseup;
}

let isDirty = true;

function loop(time: number) {
  if (isDirty) {
    const ctx = renderState!.ctx;
    ctx.fillStyle = "#ff00ff";
    ctx.fillRect(100, 100, 100, 100);
    isDirty = false;
  }
  requestAnimationFrame(loop);
}

export { loop as renderLoop };