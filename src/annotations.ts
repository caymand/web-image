import { Components, addComponents } from "./ecs/components";
import { type Entity, newEntity } from "./ecs/entity";

export function newPoint(x: number, y: number, r: number): Entity {
  const entity: Entity = newEntity();
  const [, archeType] = addComponents(
    entity, Components.POINT | Components.ANIMATION
  );

  const pointComponentIdx = archeType.componentOffset.get(Components.POINT)!;
  const animationCompIdx = archeType.componentOffset.get(Components.ANIMATION)!;
  archeType.columns[pointComponentIdx].push(x, y, r);
  archeType.columns[animationCompIdx].push(1.0);

  return entity;
}