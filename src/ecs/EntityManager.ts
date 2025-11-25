import { firstSet, stripBits } from "../BitSet";
import type { Entity } from "./Entity";

export interface EntitySystem {
  // Map a component type to the list of components with that type
  ComponentTables: Map<Components, Array<unknown>>;
  // Map an entity to all component types registered to that entity
  ComponentsForEntity: Map<Entity, Map<Components, number>>;
  // Map component types to entities registered to thtat component.
  EntitiesWithComponent: Map<Components, Array<Entity>>;
}

const entitySystem: EntitySystem = {
  ComponentTables: new Map(),
  ComponentsForEntity: new Map(),
  EntitiesWithComponent: new Map(),
}

export enum Components {
  NONE = 0,
  POINT = 1 << 0,
  ANIMATION = 1 << 1,
  RENDERABLE = 1 << 2,
  SIZE = 1 << 3,
}

export interface LinearAnimation {
  start: number;
  duration: number;
  value: number;
}

export type Size = number;

export interface Position {
  x: number;
  y: number;
}
type Renderable = boolean;


type ComponentTypeMap = {
  [Components.NONE]: never
  [Components.POINT]: Position;
  [Components.ANIMATION]: LinearAnimation;
  [Components.RENDERABLE]: Renderable;
  [Components.SIZE]: Size;
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
  entity: Entity, componentType: T, component: ComponentTypeMap[T]) {
  // Update Component->Entity table
  let entities = entitySystem.EntitiesWithComponent.get(componentType);
  if (entities === undefined) {
    entities = []
    entitySystem.EntitiesWithComponent.set(componentType, entities);
  }
  entities.push(entity);

  // Find the offset in the component table and update
  // the entity -> (componentype, component_data_id map),
  let componentTable = entitySystem.ComponentTables.get(componentType) as Array<ComponentTypeMap[T]> | undefined;
  if (componentTable === undefined) {
    componentTable = [];
    entitySystem.ComponentTables.set(componentType, componentTable);
  }
  const componentIdx = componentTable!.length;
  componentTable.push(component);

  let registeredComponents = entitySystem.ComponentsForEntity.get(entity);
  // NOTE: We should always take this branch. Otherwise we try to add
  // a component twice. Instead, we should modify the existing component
  // or delete it and add it again.
  if (registeredComponents === undefined) {
    registeredComponents = new Map();
    entitySystem.ComponentsForEntity.set(entity, registeredComponents);
  }
  registeredComponents.set(componentType, componentIdx);


  // Update the archetype if this creates a new archetype
  let archeType = Components.NONE;
  for (const componentType of registeredComponents.keys()) {
    archeType |= componentType;
  }
  if (archeType !== componentType) {
    let entitiesWithArcheType = entitySystem.EntitiesWithComponent.get(archeType);
    if (entitiesWithArcheType === undefined) {
      entitiesWithArcheType = []
      entitySystem.EntitiesWithComponent.set(archeType, entitiesWithArcheType);
    }
    entitiesWithArcheType.push(entity);
    // Mark that this entity has this archeType
    registeredComponents.set(archeType, -1);
  }

}

export function GetComponent<T extends Components>(
  entity: Entity, componentType: T
): ComponentTypeMap[T] {
  const registeredComponents = entitySystem.ComponentsForEntity.get(entity);
  if (registeredComponents === undefined) {
    throw new DOMException("Entity does not pocess component");
  }

  const componentIdx = registeredComponents.get(componentType);
  const componentTable = entitySystem.ComponentTables.get(componentType);

  if (componentIdx !== undefined && componentTable !== undefined) {
    return componentTable[componentIdx] as ComponentTypeMap[T];
  }
  throw new DOMException("Entity does not pocess component");
}

export function SetComponent<T extends Components>(
  entity: Entity, componentType: T, value: ComponentTypeMap[T]
) {
  const registeredComponents = entitySystem.ComponentsForEntity.get(entity);
  const componentIdx = registeredComponents?.get(componentType);
  if (componentIdx !== undefined) {
    const componentTable = entitySystem.ComponentTables.get(componentType);
    if (componentTable !== undefined) {
      componentTable[componentIdx] = value;
    }
  }
  throw new DOMException("Component not registed for entity");
}

export function GetAllComponentsOfType<T extends Components>(
  componentType: T
): Array<ComponentTypeMap[T]> {
  const componentTable = entitySystem.ComponentTables.get(componentType);
  return (componentTable ?? []) as Array<ComponentTypeMap[T]>;
}

export function GetEntitiesWithComponent<T extends Components>(
  archeType: T
): Array<Entity> {
  return entitySystem.EntitiesWithComponent.get(archeType) ?? [];
}