// src/commands/StopScrollingCommand.ts
import type { Command } from './Command';

export class StopScrollingCommand implements Command {
  constructor(private store: any) {}

  execute() {
    this.store.stopScrolling();
  }
}