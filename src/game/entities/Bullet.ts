import { wrapPosition } from "../math";
import type { Vec2 } from "../types";

export class Bullet {
  public readonly position: Vec2;
  public readonly velocity: Vec2;
  public readonly radius: number;
  private lifeRemaining: number;

  constructor(position: Vec2, velocity: Vec2, radius: number, lifetimeSeconds: number) {
    this.position = { ...position };
    this.velocity = { ...velocity };
    this.radius = radius;
    this.lifeRemaining = lifetimeSeconds;
  }

  public get isAlive(): boolean {
    return this.lifeRemaining > 0;
  }

  public update(dt: number, worldWidth: number, worldHeight: number): void {
    this.lifeRemaining -= dt;
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
    wrapPosition(this.position, worldWidth, worldHeight);
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();
    ctx.fillStyle = "#dce9ff";
    ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}
