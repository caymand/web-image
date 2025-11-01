import { firstSet, stripBits } from "../BitSet";

export interface Animation {
  start: number;
  duration: number;
  value: number;
}

type PositionArray = Array<number>;
type EntityArray = Array<number>;
type LinearAnimationArray = Array<Animation>;
type RenderableArray = Array<boolean>;

type ComponentArrays = PositionArray | LinearAnimationArray | RenderableArray;

export enum Components {
  POINT = 1 << 0,
  ANIMATION = POINT << 1,
  RENDERABLE = ANIMATION << 1,
}

type ComponentMap = {
  [Components.POINT]: PositionArray;
  [Components.ANIMATION]: LinearAnimationArray;
  [Components.RENDERABLE]: RenderableArray;
};

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

export function getComponent<T extends Components>(
  archeType: ComponentTable, component: T
): ComponentMap[T] {
  const componentIdx = archeType.componentOffset.get(component)!;

  return archeType.columns[componentIdx] as ComponentMap[T];
}

export function queryComponent<T extends Components>(
  componentType: T
): Array<ComponentMap[T]> {
  const matchingComponents: ComponentMap[T][] = [];

  for (let i = 0; i < componentsState.componentTables.length; i++) {
    const archeType = componentsState.componentTables[i];    
    if (archeType.archeTypeId & componentType) {            
      const component = getComponent<T>(archeType, componentType)
      matchingComponents.push(component);
    }
  }
  return matchingComponents;

}

export function queryEntities(components: Components): ComponentTable | null {
  for (let i = 0; i < componentsState.componentTables.length; i++) {
    const archType = componentsState.componentTables[i];

    // TODO(k): We should also consider the case where only a subset matches.
    if (archType.archeTypeId == components) {
      return archType;
    }
  }
  return null;
}