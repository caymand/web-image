import { firstSet, stripBits } from "../BitSet";
import type { Entity } from "./Entity";

export interface EntitySystem {
  ComponentTables: Map<Components, Array<unknown>>;
  RegisteredComponents: Map<Entity, [Components, number]>;
  ComponentEntityMap: Map<Components, Array<Entity>>;
}

const entitySystem: EntitySystem = {
  ComponentTables: new Map(),
  RegisteredComponents: new Map(),
  ComponentEntityMap: new Map(),
}

export enum Components {
  NONE = 0,
  POINT = 1 << 0,
  ANIMATION = POINT << 1,
  RENDERABLE = ANIMATION << 1
}

export interface Animation {
  start: number;
  duration: number;
  value: number;
}

type Position = number;
type LinearAnimation = number;
type Renderable = boolean;


type ComponentTypeMap = {
  [Components.NONE]: never
  [Components.POINT]: Position;
  [Components.ANIMATION]: LinearAnimation;
  [Components.RENDERABLE]: Renderable;
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

export function AddComponent<T extends Components>(
  entity: Entity, componentType: T, component: ComponentTypeMap[T]
) {
  let entities = entitySystem.ComponentEntityMap.get(componentType);
  if (entities === undefined) {
    entities = []
    entitySystem.ComponentEntityMap.set(componentType, entities);
  }
  let componentTable = entitySystem.ComponentTables.get(componentType) as Array<ComponentTypeMap[T]> | undefined;
  if (componentTable === undefined) {
    componentTable = [];
    entitySystem.ComponentTables.set(componentType, componentTable);
  }
  const componentIdx = componentTable!.length;
  let registeredComponents = entitySystem.RegisteredComponents.get(entity);
  // NOTE: We should always take this branch. Otherwise we try to add
  // a component twice. Instead, we should modify the existing component
  // or delete it and add it again.
  if (registeredComponents === undefined) {
    registeredComponents = [componentType, componentIdx];
    entitySystem.RegisteredComponents.set(entity, registeredComponents);
  }
  componentTable!.push(component);
  entities!.push(entity);
}

// TODO(k): Note sure I want this anymore.
// function AddComponents(entity: Entity, components: Components) {
//   const componentsList = getIndividualComponents(components);

//   for (let i = 0; i < componentsList.length; i++) {
//     const component = componentsList[i];
//     const entities = entitySystem.ComponentEntityMap.get(component);
//     // Add the entity to the list of entities pocessing that component
//     if (entities !== undefined) {
//       entities.push(entity);
//     } else {
//       entitySystem.ComponentEntityMap.set(component, [entity]);
//     }
//     // TODO(k): Ideally I would want to do a default value for the 
//     // Actual component and push it to the ComponentMap.
//     // This way entity creation is simple, and I can also
//     // easily add to the EntityComponentMap.

//   }
// }

export function GetComponent<T extends Components>(
  entity: Entity, componentType: Components
): ComponentTypeMap[T] {
  if (!entitySystem.RegisteredComponents.has(entity)) {
    throw new DOMException("Entity does not pocess component");
  }

  const [, componentIdx] = entitySystem.RegisteredComponents.get(entity)!;
  const componentTable = entitySystem.ComponentTables.get(componentType);

  if (componentTable !== undefined) {
    return componentTable[componentIdx] as ComponentTypeMap[T];
  }
  throw new DOMException("Entity does not pocess component");
}

export function GetAllComponentsOfType<T extends Components>(
  componentType: T
): Array<ComponentTypeMap[T]> {
  const componentTable = entitySystem.ComponentTables.get(componentType);
  return (componentTable ?? []) as Array<ComponentTypeMap[T]>;
}

export function GetEntitiesWithComponent<T extends Components>(
  componentType: T
) : Array<Entity> {
  return entitySystem.ComponentEntityMap.get(componentType) ?? [];
}