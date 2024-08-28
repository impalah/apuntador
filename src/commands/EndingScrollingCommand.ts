// src/commands/EndingScrollingCommand.ts
import type { Command } from './Command';

export class EndingScrollingCommand implements Command {
  constructor(private store: any) {}

  execute() {
    this.store.scrollEnd();
  }
}