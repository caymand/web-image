type PositionArray = Array<number>;
type ObjectArray = Array<number>;
type AnimationArray = Array<number>;
// TODO: colorComponent

type ComponentArrays = ObjectArray | PositionArray | AnimationArray;

export type Object = number;

export enum Components {
  OBJECT = 0,
  POINT,
  ANIMATION,
}

export interface ComponentTable {
  length: number;
  archeTypeId: number;
  componentOffset: Map<Components, number>;
  columns: (ComponentArrays)[]
}


export interface DrawState {
  // 64-bit increasing id counter.
  nextId: Object;
  // Bit offset
  nextComponentSlot: number;
  // Cache mapping a component name to its slot.
  componentIds: Map<Components, number>;

  // Store archetypes
  componentTables: Array<ComponentTable>;
}

export interface Drawable {
  entity: number;
  properties: Array<number>;
  isDirty: boolean;

  hot: number;
}

const drawState: DrawState = {
  nextId: 0,
  nextComponentSlot: 0,
  componentIds: new Map(),
  componentTables: []
};

function getNextId() {
  const nextId = drawState.nextId++;

  return nextId;
}

function getNextComponentId() {
  if (drawState.nextComponentSlot >= 63) {
    throw new DOMException("Too many components allocated");
  }
  const componentSlot = drawState.nextComponentSlot++;
  const componentId = 1 << componentSlot;

  return componentId;
}

// TODO(k): This also crates a new componentID if the component was not
// found. This is useful for when creating an arctype with a new component
// but it also means querying for an invalid component creates an ID.
function getArcheTypeId(components: Components[]) {
  let archeType = 0;
  for (let i = 0; i < components.length; i++) {
    const component = components[i];
    let componentId = drawState.componentIds.get(component);

    if (componentId === undefined) {
      componentId = getNextComponentId();
      drawState.componentIds.set(component, componentId);
    }
    archeType |= componentId;
  }
  return archeType;
}

function addComponents(
  object: number, components: Components[]
): [number, ComponentTable] {
  const archetypeId = getArcheTypeId(components);
  for (let i = 0; i < drawState.componentTables.length; i++) {
    const archeType = drawState.componentTables[i];
    if (archeType.archeTypeId === archetypeId) {
      archeType.columns[0].push(object);
      return [archetypeId, archeType];
    }
  }

  // If the archeType has not yet been created, we need to create it
  const objArry: ObjectArray = [object]
  let offsetTable = new Map<Components, number>();
  // Store objectIds + all components
  let columns = new Array<ComponentArrays>(components.length + 1);
  columns[0] = objArry;

  for (let i = 0; i < components.length; i++) {
    const component = components[i];
    const offset = i + 1;
    offsetTable.set(component, offset);
    columns[offset] = new Array();
  }

  const componentTable: ComponentTable = {
    length: 1,
    componentOffset: offsetTable,
    archeTypeId: archetypeId,
    columns: columns
  };

  drawState.componentTables.push(componentTable);

  return [archetypeId, componentTable];
}

export function getComponent(archeType: ComponentTable, component: Components) {
  const componentIdx = archeType.componentOffset.get(component)!;

  return archeType.columns[componentIdx];
}

export function newPoint(x: number, y: number, r: number): Object {
  const objectId: Object = getNextId();
  const pointComponent = Components.POINT;
  const animationComp = Components.ANIMATION;
  const [, archeType] = addComponents(objectId, [pointComponent, animationComp]);

  const pointComponentIdx = archeType.componentOffset.get(pointComponent)!;
  const animationCompIdx = archeType.componentOffset.get(animationComp)!;
  archeType.columns[pointComponentIdx].push(x, y, r);
  archeType.columns[animationCompIdx].push(1.0);

  return objectId;
}

export function queryObjects(components: Components[]): ComponentTable | null {
  const archeTypeId = getArcheTypeId(components);
  for (let i = 0; i < drawState.componentTables.length; i++) {
    const archType = drawState.componentTables[i];
    if (archType.archeTypeId == archeTypeId) {
      return archType;
    }
  }
  return null;
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
