export interface DrawState {
  nextId: number;
  vertices: Array<number>;
  vertexIdxs: Map<number, number>;
}

export interface Drawable {
  entity: number;
  properties: Array<number>;
  isDirty: boolean;

  hot: number;
}

export interface Point {
  x: number;
  y: number;
}

const drawState: DrawState = { 
  nextId: 0, 
  vertices: [], 
  vertexIdxs: new Map() 
};

function getNextId() {
  const nextId = drawState.nextId;
  drawState.nextId++;

  return nextId;
}

export function newPoint(x: number, y: number) {  
  const id = getNextId();
  const offset = drawState.vertices.length;
  drawState.vertexIdxs.set(id, offset);
  drawState.vertices.push(x, y);

  const drawable: Drawable = {
    entity: id,
    hot: 0,
    isDirty: true,
    properties: []
  }

  return drawable;
}



const components: Array<number> = [];

export interface Line {
  x: number;
  y: number;
}


export function newLine(x1: number, y1: number, x2: number, y2: number) {
  const p1: Point = newPoint(x1, x2)
  const p2: Point = newPoint(x1, x2);

  const id = getNextId();


}

/** Want to draw a straight line, from the click until the current mouse
 * position. When dragging stops, we stop the line and save the object.
 * 
 * Operations we wish to perform on a line.
 *  - Move end points
 *  - Increate thickness
 * 
 * This also entails:
 * - Hit testing
 * - An entity system for shapes (points, lines, ...more?)
 */
