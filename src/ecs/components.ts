import { firstSet, stripBits } from "../BitSet";

type PositionArray = Array<number>;
type EntityArray = Array<number>;
type LinearAnimationArray = Array<number>;
type RenderableArray = Array<boolean>;

type ComponentArrays = PositionArray | LinearAnimationArray ;

export enum Components {
  POINT = 1 << 0,
  ANIMATION = POINT << 1,
  RENDERABLE = ANIMATION << 1,
}


export interface ComponentTable {
  // Table length
  length: number;
  // Bitflag for the component table. It is a key that quickly lets us
  // put an entity into a table.
  archeTypeId: number;
  // Offset map from component to column.
  componentOffset: Map<Components, number>;
  entities: EntityArray;
  // The data
  columns: (ComponentArrays)[]
}

/** State for keeping track of component creation */
interface ComponentsState {
  // Bit offset
  nextComponentSlot: number;
  // Cache mapping a component name to its slot.
  componentIds: Map<Components, number>;

  // Store archetypes
  componentTables: Array<ComponentTable>;
}


const componentsState: ComponentsState = {
  nextComponentSlot: 0,
  componentIds: new Map(),
  componentTables: []
};

// function getNextComponentId() {
//   if (componentsState.nextComponentSlot >= 63) {
//     throw new DOMException("Too many components allocated");
//   }
//   const componentSlot = componentsState.nextComponentSlot++;
//   const componentId = 1 << componentSlot;

//   return componentId;
// }

/** FUNCTIONS FOR CREATING AND UPDATING COMPONENTS */

// TODO(k): This also crates a new componentID if the component was not
// found. This is useful for when creating an arctype with a new component
// but it also means querying for an invalid component creates an ID.
// function registerComponentTable(components: Components) {

//   let archeType = 0;
//   for (let i = 0; i < components.length; i++) {
//     const component = components[i];
//     let componentId = componentsState.componentIds.get(component);

//     if (componentId === undefined) {
//       componentId = getNextComponentId();
//       componentsState.componentIds.set(component, componentId);
//     }
//     archeType |= componentId;
//   }
//   return archeType;
// }

export function getIndividualComponents(components: Components): Array<Components> {
  let idx = firstSet(components);
  const individualComponents: Array<number> = []

  while (idx >= 0) {
    const component = 1 << idx;
    individualComponents.push(component);
    const remaining = stripBits(idx, components);
    idx = firstSet(remaining);
  }

  return individualComponents;
}

export function addComponents(
  entity: number, components: Components
): [number, ComponentTable] {
  for (let i = 0; i < componentsState.componentTables.length; i++) {
    const archeType = componentsState.componentTables[i];
    if (archeType.archeTypeId === components) {
      archeType.entities.push(entity);
      return [components, archeType];
    }
  }

  // If the archeType has not yet been created, we need to create it
  const entities: EntityArray = [entity]
  let offsetTable = new Map<Components, number>();
  const componentsArray = getIndividualComponents(components);

  // Store objectIds + all components
  let columns = new Array<ComponentArrays>(componentsArray.length);
  columns[0] = entities;

  for (let i = 0; i < componentsArray.length; i++) {
    const component = componentsArray[i];
    const offset = i;
    offsetTable.set(component, offset);
    columns[offset] = new Array();
  }

  const componentTable: ComponentTable = {
    length: 1,
    componentOffset: offsetTable,
    entities: entities,
    archeTypeId: components,
    columns: columns
  };

  componentsState.componentTables.push(componentTable);

  return [components, componentTable];
}

export function getComponent(archeType: ComponentTable, component: Components) {
  const componentIdx = archeType.componentOffset.get(component)!;

  return archeType.columns[componentIdx];
}

export function queryObjects(components: Components): ComponentTable | null {
  for (let i = 0; i < componentsState.componentTables.length; i++) {
    const archType = componentsState.componentTables[i];
    if (archType.archeTypeId == components) {
      return archType;
    }
  }
  return null;
}