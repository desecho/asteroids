export type AsteroidSize = "large" | "medium" | "small";

export interface Vec2 {
  x: number;
  y: number;
}

export interface AsteroidConfig {
  radius: number;
  minSpeed: number;
  maxSpeed: number;
  score: number;
}

export interface GameConfig {
  fixedTimeStep: number;
  maxFrameTime: number;
  shipTurnSpeed: number;
  shipThrust: number;
  shipDamping: number;
  shipMaxSpeed: number;
  shipRadius: number;
  shipInvulnerability: number;
  bulletSpeed: number;
  bulletRadius: number;
  bulletLifetime: number;
  maxBullets: number;
  shootCooldown: number;
  baseAsteroids: number;
  asteroidsPerLevel: number;
  asteroidSpawnSafeRadius: number;
  asteroidBySize: Record<AsteroidSize, AsteroidConfig>;
}

export interface HudElements {
  score: HTMLElement;
  best: HTMLElement;
  lives: HTMLElement;
  level: HTMLElement;
  restartButton: HTMLButtonElement;
}
