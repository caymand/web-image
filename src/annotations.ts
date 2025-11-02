import { Components, addComponents, getComponent } from "./ecs/components";
import { type Entity, newEntity } from "./ecs/entity";

export function newPoint(currentTime: number, x: number, y: number, r: number): Entity {
  const entity: Entity = newEntity();
  const [, archeType] = addComponents(
    entity, Components.POINT | Components.ANIMATION
  );

  const positions = getComponent(archeType, Components.POINT);
  const animations = getComponent(archeType, Components.ANIMATION);
  positions.push(x, y, r);
  animations.push({duration: 100, start: currentTime, value: 0});

  return entity;
}

export function lineSegment() {
  
}