// src/commands/ToggleReverseCommand.ts
import type { Command } from './Command';

export class ToggleReverseCommand implements Command {
  constructor(private store: any) {}

  execute() {
    this.store.toggleReverse();
  }
}