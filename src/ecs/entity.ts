import { Components } from "./EntityManager";

let nextId = 0;

// Table 5
const entities: Map<Entity, Components> = new Map();

export type Entity = number;

export function newEntity() : Entity {
  const entity = nextId++;
  entities.set(entity, Components.NONE);

  return entity;
}
