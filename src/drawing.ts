type PositionArray = Array<number>;
type ObjectArray = Array<number>;

type ComponentArrays = ObjectArray | PositionArray;

export type Object = number;

enum Components {
  OBJECT = 0,
  POINT,
}

export interface ComponentTable {
  length: number;
  archetypeId: number;
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
  const componentSlot = drawState.nextComponentSlot++;
  const componentId = 1 << componentSlot;

  return componentId;
}

function getArcheTypeId(components: Components[]) {
  let archeType = 0;
  for (let i = 0; i < components.length; i++) {
    const component = components[i];
    let componentId = drawState.componentIds.get(component);

    if (componentId === undefined) {
      componentId = getNextComponentId();
    }
    drawState.componentIds.set(component, componentId);
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
    if (archeType.archetypeId === archetypeId) {
      archeType.columns[0].push(object);
      return [archetypeId, archeType];
    }
  }

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
    archetypeId: archetypeId,
    columns: columns
  };

  drawState.componentTables.push(componentTable);

  return [archetypeId, componentTable];
}

export function newPoint(x: number, y: number): Object {
  const objectId: Object = getNextId();
  const pointComponent = Components.POINT;
  const [archeTypeId, archeType] = addComponents(objectId, [pointComponent]);

  const pointComponentIdx = archeType.componentOffset.get(pointComponent)!;
  archeType.columns[pointComponentIdx].push(x, y);
  
  return objectId;
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
