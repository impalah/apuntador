// src/commands/TogglePlayCommand.ts
import type { Command } from './Command';

export class TogglePlayCommand implements Command {
  constructor(private store: any) {}

  execute() {
    this.store.togglePlay();
  }
}