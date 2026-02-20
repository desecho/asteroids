import type { Vec2 } from "./types";

export const TAU = Math.PI * 2;

export function angleToVector(angle: number): Vec2 {
  return { x: Math.cos(angle), y: Math.sin(angle) };
}

export function distanceSquared(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

export function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function randomDirection(): Vec2 {
  const angle = randomRange(0, TAU);
  return angleToVector(angle);
}

export function wrapPosition(position: Vec2, width: number, height: number): void {
  if (position.x < 0) {
    position.x += width;
  } else if (position.x >= width) {
    position.x -= width;
  }

  if (position.y < 0) {
    position.y += height;
  } else if (position.y >= height) {
    position.y -= height;
  }
}

export function clampMagnitude(vector: Vec2, max: number): void {
  const magnitude = Math.hypot(vector.x, vector.y);
  if (magnitude > max && magnitude > 0) {
    const ratio = max / magnitude;
    vector.x *= ratio;
    vector.y *= ratio;
  }
}
