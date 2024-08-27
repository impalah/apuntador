// src/commands/UpdateTextColorCommand.ts
import type { Command } from './Command';

export class UpdateTextColorCommand implements Command {
  constructor(private store: any, private textColor: string) {}

  execute() {
    this.store.setTextColor(this.textColor);
  }
}