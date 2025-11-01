export type Entity = number;
let nextId = 0;

export function newEntity() : Entity {
  const entity = nextId++;

  return entity;
}