import { Game } from "./game/Game";
import type { HudElements } from "./game/types";

function requireElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing required element: #${id}`);
  }
  return element as T;
}

const canvas = requireElement<HTMLCanvasElement>("game-canvas");
const hud: HudElements = {
  score: requireElement("score"),
  lives: requireElement("lives"),
  level: requireElement("level"),
  restartButton: requireElement<HTMLButtonElement>("restart"),
};

const game = new Game(canvas, hud);
game.start();

window.addEventListener("beforeunload", () => {
  game.destroy();
});
