
export interface Line {
  x: number;
  y: number;
}

export function newLine(x: number, y: number) {
  return {x, y};
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
