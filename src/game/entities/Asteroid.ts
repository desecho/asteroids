import { randomRange, TAU, wrapPosition } from "../math";
import type { AsteroidSize, Vec2 } from "../types";

export class Asteroid {
  public readonly size: AsteroidSize;
  public readonly position: Vec2;
  public readonly velocity: Vec2;
  public readonly radius: number;
  private readonly points: Vec2[];
  private angle: number;
  private readonly spin: number;

  private constructor(
    size: AsteroidSize,
    position: Vec2,
    velocity: Vec2,
    radius: number,
    points: Vec2[],
    angle: number,
    spin: number,
  ) {
    this.size = size;
    this.position = position;
    this.velocity = velocity;
    this.radius = radius;
    this.points = points;
    this.angle = angle;
    this.spin = spin;
  }

  public static create(size: AsteroidSize, position: Vec2, velocity: Vec2, radius: number): Asteroid {
    const points = Asteroid.generatePoints(size, radius);
    return new Asteroid(
      size,
      { ...position },
      { ...velocity },
      radius,
      points,
      randomRange(0, TAU),
      randomRange(-0.8, 0.8),
    );
  }

  public update(dt: number, worldWidth: number, worldHeight: number): void {
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
    this.angle += this.spin * dt;
    wrapPosition(this.position, worldWidth, worldHeight);
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(this.angle);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#b7c7dd";
    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);
    for (let i = 1; i < this.points.length; i += 1) {
      ctx.lineTo(this.points[i].x, this.points[i].y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  private static generatePoints(size: AsteroidSize, radius: number): Vec2[] {
    const [minPoints, maxPoints] = Asteroid.vertexRangeBySize(size);
    const pointCount = Math.floor(randomRange(minPoints, maxPoints + 1));
    const points: Vec2[] = [];

    for (let i = 0; i < pointCount; i += 1) {
      const angle = (i / pointCount) * TAU;
      const jitter = randomRange(0.72, 1.2);
      points.push({
        x: Math.cos(angle) * radius * jitter,
        y: Math.sin(angle) * radius * jitter,
      });
    }

    return points;
  }

  private static vertexRangeBySize(size: AsteroidSize): [number, number] {
    if (size === "large") {
      return [11, 15];
    }
    if (size === "medium") {
      return [9, 12];
    }
    return [7, 10];
  }
}
