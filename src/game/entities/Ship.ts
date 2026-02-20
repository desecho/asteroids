import { angleToVector, clampMagnitude, wrapPosition } from "../math";
import type { GameConfig, Vec2 } from "../types";
import { Input } from "../Input";

export class Ship {
  public readonly position: Vec2;
  public readonly velocity: Vec2;
  public readonly radius: number;
  public angle: number;
  private invulnerabilityRemaining = 0;

  constructor(initialPosition: Vec2, radius: number) {
    this.position = { ...initialPosition };
    this.velocity = { x: 0, y: 0 };
    this.radius = radius;
    this.angle = -Math.PI / 2;
  }

  public get invulnerable(): boolean {
    return this.invulnerabilityRemaining > 0;
  }

  public update(
    dt: number,
    input: Input,
    config: GameConfig,
    worldWidth: number,
    worldHeight: number,
  ): void {
    if (input.isDown("ArrowLeft")) {
      this.angle -= config.shipTurnSpeed * dt;
    }
    if (input.isDown("ArrowRight")) {
      this.angle += config.shipTurnSpeed * dt;
    }

    if (input.isDown("ArrowUp")) {
      const forward = angleToVector(this.angle);
      this.velocity.x += forward.x * config.shipThrust * dt;
      this.velocity.y += forward.y * config.shipThrust * dt;
    }

    const damping = Math.max(0, 1 - config.shipDamping * dt);
    this.velocity.x *= damping;
    this.velocity.y *= damping;
    clampMagnitude(this.velocity, config.shipMaxSpeed);

    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
    wrapPosition(this.position, worldWidth, worldHeight);

    if (this.invulnerabilityRemaining > 0) {
      this.invulnerabilityRemaining = Math.max(0, this.invulnerabilityRemaining - dt);
    }
  }

  public reset(position: Vec2): void {
    this.position.x = position.x;
    this.position.y = position.y;
    this.velocity.x = 0;
    this.velocity.y = 0;
    this.angle = -Math.PI / 2;
    this.invulnerabilityRemaining = 0;
  }

  public respawn(position: Vec2, invulnerabilitySeconds: number): void {
    this.reset(position);
    this.invulnerabilityRemaining = invulnerabilitySeconds;
  }

  public getNosePosition(distanceFromCenter = this.radius + 2): Vec2 {
    const forward = angleToVector(this.angle);
    return {
      x: this.position.x + forward.x * distanceFromCenter,
      y: this.position.y + forward.y * distanceFromCenter,
    };
  }

  public draw(ctx: CanvasRenderingContext2D, nowSeconds: number): void {
    if (this.invulnerable && Math.floor(nowSeconds * 12) % 2 === 0) {
      return;
    }

    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(this.angle);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#f4f8ff";
    ctx.beginPath();
    ctx.moveTo(16, 0);
    ctx.lineTo(-12, 10);
    ctx.lineTo(-12, -10);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}
