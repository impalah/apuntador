// src/commands/SetTextAlignCommand.ts
import type { Command } from './Command';

export class SetTextAlignCommand implements Command {
  constructor(private store: any, private align: string) {}

  execute() {
    this.store.setTextAlign(this.align);
  }
}