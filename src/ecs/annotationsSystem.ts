import { AddComponent, GetAllComponentsOfType, GetComponent, GetEntitiesWithComponent, SetComponent } from "./EntityManager";
import { type Entity, newEntity } from "./Entity";
import { Components, type Vec2 } from "./Components";

export function newPoint(currentTime: number, x: number, y: number, r: number): Entity {
  const entity: Entity = newEntity();

  AddComponent(entity, Components.POINT, { x, y });
  AddComponent(entity, Components.ANIMATION,
    { duration: 100, start: currentTime, value: 0 });
  AddComponent(entity, Components.SIZE, r);

  return entity;
}

export function lineSegment(p1: Vec2) {
  const entity: Entity = newEntity();
  AddComponent(entity, Components.LINE_SEGMENT, { p1: p1, p2: {x: p1.x, y: p1.y} }) 
  AddComponent(entity, Components.SIZE, 5); // Thickness of the line
  AddComponent(entity, Components.SELECTABLE, true);
}

export function updateLine() {
  const inputCtx = GetAllComponentsOfType(Components.INPUT_CONTEXT)[0];
  const lineEntities = GetEntitiesWithComponent(Components.LINE_SEGMENT | Components.SIZE | Components.SELECTABLE); 

  for (let i = 0; i < lineEntities.length; i++) {
    const line = lineEntities[i];
    const lineSegment = GetComponent(line, Components.LINE_SEGMENT);
    const isSelected = GetComponent(line, Components.SELECTABLE)
    if (!isSelected) {
      continue;
    }        
    if (!inputCtx.pointerDown) {
      SetComponent(line, Components.SELECTABLE, false);
    // TODO(k): Technically we miss the single frame where the position is 
    // updated and pointer is released.    
    return;
  }
    // Update the selected line
    lineSegment.p2.x = inputCtx.x;
    lineSegment.p2.y = inputCtx.y;    
  }
}
