// src/commands/ToggleEditModeCommand.ts
import type { Command } from './Command';

export class ToggleEditModeCommand implements Command {
  constructor(private store: any, private isEditing: boolean) {}

  execute() {
    this.store.setEditingMode(this.isEditing);
  }
}