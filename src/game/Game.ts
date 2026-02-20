import { Input } from "./Input";
import { Asteroid } from "./entities/Asteroid";
import { Bullet } from "./entities/Bullet";
import { Ship } from "./entities/Ship";
import { angleToVector, distanceSquared, randomDirection, randomRange } from "./math";
import type { AsteroidSize, GameConfig, HudElements, Vec2 } from "./types";

const NEXT_ASTEROID_SIZE: Record<AsteroidSize, AsteroidSize | null> = {
  large: "medium",
  medium: "small",
  small: null,
};

const DEFAULT_CONFIG: GameConfig = {
  fixedTimeStep: 1 / 120,
  maxFrameTime: 0.25,
  shipTurnSpeed: Math.PI * 2.8,
  shipThrust: 320,
  shipDamping: 0.12,
  shipMaxSpeed: 420,
  shipRadius: 14,
  shipInvulnerability: 2,
  bulletSpeed: 560,
  bulletRadius: 2.4,
  bulletLifetime: 1.2,
  maxBullets: 6,
  shootCooldown: 0.12,
  baseAsteroids: 5,
  asteroidsPerLevel: 1,
  asteroidSpawnSafeRadius: 170,
  asteroidBySize: {
    large: { radius: 52, minSpeed: 32, maxSpeed: 72, score: 20 },
    medium: { radius: 32, minSpeed: 58, maxSpeed: 108, score: 50 },
    small: { radius: 18, minSpeed: 92, maxSpeed: 148, score: 100 },
  },
};

export class Game {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly input: Input;
  private readonly ship: Ship;
  private readonly config: GameConfig;

  private bullets: Bullet[] = [];
  private asteroids: Asteroid[] = [];
  private score = 0;
  private lives = 3;
  private level = 1;
  private gameOver = false;
  private accumulator = 0;
  private previousFrameSeconds = 0;
  private shootCooldownRemaining = 0;
  private rafId: number | null = null;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly hud: HudElements,
    config: GameConfig = DEFAULT_CONFIG,
  ) {
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Unable to create 2D rendering context.");
    }

    this.ctx = context;
    this.config = config;
    this.input = new Input(window);
    this.ship = new Ship(this.getWorldCenter(), this.config.shipRadius);

    this.hud.restartButton.addEventListener("click", this.onRestart);
  }

  public start(): void {
    this.resetState();
    this.rafId = requestAnimationFrame(this.onFrame);
  }

  public destroy(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    this.hud.restartButton.removeEventListener("click", this.onRestart);
    this.input.destroy();
  }

  private onRestart = (): void => {
    this.resetState();
  };

  private onFrame = (timestampMs: number): void => {
    const nowSeconds = timestampMs / 1000;
    if (this.previousFrameSeconds === 0) {
      this.previousFrameSeconds = nowSeconds;
    }

    let frameDt = nowSeconds - this.previousFrameSeconds;
    this.previousFrameSeconds = nowSeconds;
    frameDt = Math.min(frameDt, this.config.maxFrameTime);

    // Fixed-step simulation with an accumulator for deterministic gameplay updates.
    this.accumulator += frameDt;
    while (this.accumulator >= this.config.fixedTimeStep) {
      this.update(this.config.fixedTimeStep);
      this.accumulator -= this.config.fixedTimeStep;
    }

    this.render(nowSeconds);
    this.rafId = requestAnimationFrame(this.onFrame);
  };

  private update(dt: number): void {
    if (!this.gameOver) {
      this.ship.update(dt, this.input, this.config, this.canvas.width, this.canvas.height);

      this.shootCooldownRemaining = Math.max(0, this.shootCooldownRemaining - dt);
      if (this.input.isDown("Space")) {
        this.tryShoot();
      }

      for (let i = this.bullets.length - 1; i >= 0; i -= 1) {
        const bullet = this.bullets[i];
        bullet.update(dt, this.canvas.width, this.canvas.height);
        if (!bullet.isAlive) {
          this.bullets.splice(i, 1);
        }
      }

      for (const asteroid of this.asteroids) {
        asteroid.update(dt, this.canvas.width, this.canvas.height);
      }

      this.resolveBulletAsteroidCollisions();
      this.resolveShipAsteroidCollision();

      if (!this.gameOver && this.asteroids.length === 0) {
        this.level += 1;
        this.spawnLevelAsteroids();
      }
    }

    this.updateHud();
  }

  private render(nowSeconds: number): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = "#05070b";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    for (const asteroid of this.asteroids) {
      asteroid.draw(this.ctx);
    }
    for (const bullet of this.bullets) {
      bullet.draw(this.ctx);
    }
    this.ship.draw(this.ctx, nowSeconds);

    if (this.gameOver) {
      this.drawGameOverOverlay();
    }
  }

  private drawGameOverOverlay(): void {
    this.ctx.save();
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = "#f5f8ff";
    this.ctx.textAlign = "center";
    this.ctx.font = "bold 54px Trebuchet MS, sans-serif";
    this.ctx.fillText("GAME OVER", this.canvas.width / 2, this.canvas.height / 2 - 12);
    this.ctx.font = "22px Trebuchet MS, sans-serif";
    this.ctx.fillText("Press Restart to play again", this.canvas.width / 2, this.canvas.height / 2 + 30);
    this.ctx.restore();
  }

  private tryShoot(): void {
    if (this.shootCooldownRemaining > 0) {
      return;
    }
    if (this.bullets.length >= this.config.maxBullets) {
      return;
    }

    const forward = angleToVector(this.ship.angle);
    const spawnPoint = this.ship.getNosePosition();
    const bulletVelocity: Vec2 = {
      x: this.ship.velocity.x + forward.x * this.config.bulletSpeed,
      y: this.ship.velocity.y + forward.y * this.config.bulletSpeed,
    };

    this.bullets.push(
      new Bullet(
        spawnPoint,
        bulletVelocity,
        this.config.bulletRadius,
        this.config.bulletLifetime,
      ),
    );
    this.shootCooldownRemaining = this.config.shootCooldown;
  }

  private resolveBulletAsteroidCollisions(): void {
    const spawnedChildren: Asteroid[] = [];

    for (let bulletIndex = this.bullets.length - 1; bulletIndex >= 0; bulletIndex -= 1) {
      const bullet = this.bullets[bulletIndex];
      let bulletHit = false;

      for (let asteroidIndex = this.asteroids.length - 1; asteroidIndex >= 0; asteroidIndex -= 1) {
        const asteroid = this.asteroids[asteroidIndex];
        const hitRadius = bullet.radius + asteroid.radius;
        if (distanceSquared(bullet.position, asteroid.position) > hitRadius * hitRadius) {
          continue;
        }

        bulletHit = true;
        this.bullets.splice(bulletIndex, 1);
        this.asteroids.splice(asteroidIndex, 1);
        this.score += this.config.asteroidBySize[asteroid.size].score;
        spawnedChildren.push(...this.splitAsteroid(asteroid));
        break;
      }

      if (bulletHit) {
        continue;
      }
    }

    if (spawnedChildren.length > 0) {
      this.asteroids.push(...spawnedChildren);
    }
  }

  private resolveShipAsteroidCollision(): void {
    if (this.ship.invulnerable) {
      return;
    }

    for (const asteroid of this.asteroids) {
      const hitRadius = this.ship.radius + asteroid.radius;
      if (distanceSquared(this.ship.position, asteroid.position) <= hitRadius * hitRadius) {
        this.handleShipHit();
        break;
      }
    }
  }

  private splitAsteroid(asteroid: Asteroid): Asteroid[] {
    const nextSize = NEXT_ASTEROID_SIZE[asteroid.size];
    if (!nextSize) {
      return [];
    }

    const nextInfo = this.config.asteroidBySize[nextSize];
    const children: Asteroid[] = [];

    // Each hit splits a rock into exactly two children until the small size is destroyed.
    for (let i = 0; i < 2; i += 1) {
      const direction = randomDirection();
      const speed = randomRange(nextInfo.minSpeed, nextInfo.maxSpeed);
      children.push(
        Asteroid.create(
          nextSize,
          {
            x: asteroid.position.x + direction.x * (nextInfo.radius * 0.4),
            y: asteroid.position.y + direction.y * (nextInfo.radius * 0.4),
          },
          {
            x: asteroid.velocity.x * 0.35 + direction.x * speed,
            y: asteroid.velocity.y * 0.35 + direction.y * speed,
          },
          nextInfo.radius,
        ),
      );
    }

    return children;
  }

  private handleShipHit(): void {
    this.lives -= 1;
    this.bullets = [];

    if (this.lives <= 0) {
      this.lives = 0;
      this.gameOver = true;
      return;
    }

    this.ship.respawn(this.getWorldCenter(), this.config.shipInvulnerability);
  }

  private resetState(): void {
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.gameOver = false;
    this.accumulator = 0;
    this.previousFrameSeconds = 0;
    this.shootCooldownRemaining = 0;
    this.bullets = [];
    this.ship.reset(this.getWorldCenter());
    this.spawnLevelAsteroids();
    this.updateHud();
  }

  private spawnLevelAsteroids(): void {
    this.asteroids = [];
    const asteroidCount =
      this.config.baseAsteroids + (this.level - 1) * this.config.asteroidsPerLevel;

    for (let i = 0; i < asteroidCount; i += 1) {
      this.asteroids.push(this.createLargeAsteroid());
    }
  }

  private createLargeAsteroid(): Asteroid {
    const largeInfo = this.config.asteroidBySize.large;
    const safeDistanceSq = this.config.asteroidSpawnSafeRadius * this.config.asteroidSpawnSafeRadius;
    let position = this.randomPosition();
    let foundSafePosition = false;

    for (let attempt = 0; attempt < 60; attempt += 1) {
      const candidate = this.randomPosition();
      if (distanceSquared(candidate, this.ship.position) >= safeDistanceSq) {
        position = candidate;
        foundSafePosition = true;
        break;
      }
    }

    if (!foundSafePosition) {
      const fallbackDirection = randomDirection();
      position = {
        x:
          (this.ship.position.x +
            fallbackDirection.x * this.config.asteroidSpawnSafeRadius +
            this.canvas.width) %
          this.canvas.width,
        y:
          (this.ship.position.y +
            fallbackDirection.y * this.config.asteroidSpawnSafeRadius +
            this.canvas.height) %
          this.canvas.height,
      };
    }

    const direction = randomDirection();
    const speed = randomRange(largeInfo.minSpeed, largeInfo.maxSpeed);
    return Asteroid.create(
      "large",
      position,
      { x: direction.x * speed, y: direction.y * speed },
      largeInfo.radius,
    );
  }

  private randomPosition(): Vec2 {
    return {
      x: randomRange(0, this.canvas.width),
      y: randomRange(0, this.canvas.height),
    };
  }

  private getWorldCenter(): Vec2 {
    return { x: this.canvas.width / 2, y: this.canvas.height / 2 };
  }

  private updateHud(): void {
    this.hud.score.textContent = `${this.score}`;
    this.hud.lives.textContent = `${this.lives}`;
    this.hud.level.textContent = `${this.level}`;
  }
}
