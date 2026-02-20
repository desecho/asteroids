# Asteroids (TypeScript + Canvas)

A browser-based Asteroids game built with TypeScript, HTML, and Canvas.

## Features

- Fixed-timestep game loop using `requestAnimationFrame`
- Ship controls:
  - `ArrowLeft` / `ArrowRight` to rotate
  - `ArrowUp` to thrust
  - `Space` to shoot
- Screen wrapping for ship, bullets, and asteroids
- Bullet cap (`6`) and bullet lifetime (`1.2s`)
- Asteroid splitting:
  - Large -> 2 Medium
  - Medium -> 2 Small
  - Small -> destroyed
- Score, lives, level HUD
- Ship respawn invulnerability (2s blinking)
- Game over at 0 lives
- Restart button

## Tech Stack

- TypeScript
- Vite
- HTML5 Canvas

## Project Structure

- `index.html` - page shell and canvas
- `src/main.ts` - app entry point
- `src/game/Game.ts` - core game loop and rules
- `src/game/entities/` - `Ship`, `Bullet`, `Asteroid`
- `src/game/Input.ts` - keyboard handling
- `src/game/math.ts` - math and wrapping utilities
- `src/game/types.ts` - shared game types/config
- `src/style.css` - UI and canvas styles

## Scripts

- `npm run dev` - start development server
- `npm run build` - type-check and build production assets
- `npm run preview` - preview production build locally

## Deployment Base Path

This project is configured to be served from:

`/games/asteroids/`

via `vite.config.ts`:

```ts
export default defineConfig({
  base: "/games/asteroids/",
});
```
