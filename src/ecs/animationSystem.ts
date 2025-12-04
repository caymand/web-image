import { GetAllComponentsOfType } from "./EntityManager";
import { Components } from "./Components";

export function linearAnimation(currentTime: number) {
  const animations = GetAllComponentsOfType(Components.ANIMATION);

  for (let i = 0; i < animations.length; i++) {
    const animationProgress = animations[i];

    if (animationProgress.start === 0) {
      animationProgress.start = currentTime;
    }
    if (animationProgress.value < 1) {
      const dt = currentTime - animationProgress.start
      const progress = Math.min(dt / animationProgress.duration, 1);
      animationProgress.value = progress;
    }
  }
}