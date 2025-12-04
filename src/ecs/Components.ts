export interface LinearAnimation {
  start: number;
  duration: number;
  value: number;
}

export type Size = number;

export interface Vec2 {
  x: number;
  y: number;
}

export interface LineSegment {
  p1: Vec2;
  p2: Vec2;
}

export interface InputContext {
  x: number;
  y: number;
  pointerDown: boolean;
}

export type Selectable = boolean;

export enum Components {
  NONE = 0,
  POINT = 1 << 0,
  ANIMATION = 1 << 1,
  SELECTABLE = 1 << 2,
  SIZE = 1 << 3,
  INPUT_CONTEXT = 1 << 4,
  LINE_SEGMENT = 1 << 5,
}

export interface ComponentTypeMap {
  [Components.NONE]: never;
  [Components.POINT]: Vec2;
  [Components.ANIMATION]: LinearAnimation;
  [Components.SELECTABLE]: Selectable;
  [Components.SIZE]: Size;
  [Components.INPUT_CONTEXT]: InputContext,
  [Components.LINE_SEGMENT]: LineSegment,
}
