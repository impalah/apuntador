// src/commands/UpdateScrollSpeedCommand.ts
import type { Command } from './Command';

export class UpdateScrollSpeedCommand implements Command {
  constructor(private store: any, private scrollSpeed: number, private maxConstant: number) {}

  execute() {
    this.store.setScrollSpeed(this.maxConstant - this.scrollSpeed); // Invert value before setting
  }
}