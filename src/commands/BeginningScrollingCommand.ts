// src/commands/BeginningScrollingCommand.ts
import type { Command } from './Command';

export class BeginningScrollingCommand implements Command {
  constructor(private store: any) {}

  execute() {
    this.store.scrollBegin();
  }
}