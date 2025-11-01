import { Components, addComponents, getComponent } from "./ecs/components";
import { type Entity, newEntity } from "./ecs/entity";

export function newPoint(x: number, y: number, r: number): Entity {
  const entity: Entity = newEntity();
  const [, archeType] = addComponents(
    entity, Components.POINT | Components.ANIMATION
  );

  const positions = getComponent<Components.POINT>(archeType, Components.POINT);
  const animations = getComponent<Components.ANIMATION>(archeType, Components.ANIMATION);
  positions.push(x, y, r);
  animations.push(1.0);

  return entity;
}