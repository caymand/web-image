import { Components, queryComponent } from "./components";

export function linearAnimation(currentTime: number) {
  const animationComponents = queryComponent(Components.ANIMATION);
  for (let i = 0; i < animationComponents.length; i++) {
    const animationComponentArray = animationComponents[i];
    for (let j = 0; j < animationComponentArray.length; j++) {
      const animation = animationComponentArray[j];
      if (animation.start === 0) {
        animation.start = currentTime;
      }
      if (animation.value < 1) {
        const dt = currentTime - animation.start
        const progress = Math.min(dt / animation.duration, 1);
        animation.value = progress;
      }
    }
  }
}