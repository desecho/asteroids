const TRACKED_KEYS = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "Space"]);

export class Input {
  private readonly heldKeys = new Set<string>();

  constructor(private readonly target: Window) {
    this.target.addEventListener("keydown", this.onKeyDown);
    this.target.addEventListener("keyup", this.onKeyUp);
    this.target.addEventListener("blur", this.onBlur);
  }

  public isDown(code: string): boolean {
    return this.heldKeys.has(code);
  }

  public destroy(): void {
    this.target.removeEventListener("keydown", this.onKeyDown);
    this.target.removeEventListener("keyup", this.onKeyUp);
    this.target.removeEventListener("blur", this.onBlur);
    this.heldKeys.clear();
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    if (!TRACKED_KEYS.has(event.code)) {
      return;
    }

    this.heldKeys.add(event.code);
    if (event.code === "Space") {
      event.preventDefault();
    }
  };

  private onKeyUp = (event: KeyboardEvent): void => {
    this.heldKeys.delete(event.code);
  };

  private onBlur = (): void => {
    this.heldKeys.clear();
  };
}
