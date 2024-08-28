// src/commands/StopScrollingCommand.ts
import type { Command } from './Command';

export class EndingScrollingCommand implements Command {
  constructor(private store: any) {}

  execute() {
    this.store.scrollEnd();
  }
}