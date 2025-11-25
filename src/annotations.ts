import { Components, AddComponent } from "./ecs/EntityManager";
import { type Entity, newEntity } from "./ecs/Entity";

export function newPoint(currentTime: number, x: number, y: number, r: number): Entity {
  const entity: Entity = newEntity();

  AddComponent(entity, Components.POINT, { x, y });
  AddComponent(entity, Components.ANIMATION, 
    { duration: 100, start: currentTime, value: 0 });
  AddComponent(entity, Components.SIZE, r);

  return entity;
}

export function lineSegment() {

}