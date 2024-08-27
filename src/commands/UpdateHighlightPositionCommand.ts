// src/commands/UpdateHighlightPositionCommand.ts
import type { Command } from './Command';

export class UpdateHighlightPositionCommand implements Command {
  constructor(private store: any, private highlightPosition: number) {}

  execute() {
    this.store.setHighlightPosition(this.highlightPosition);
  }
}