// src/commands/ToggleEditModeCommand.ts
import type { Command } from './Command';

export class ToggleEditModeCommand implements Command {
  constructor(private store: any, private isEditing: boolean) {}

  execute() {
    console.log('ToggleEditModeCommand: execute ', this.isEditing);
    this.store.setEditingMode(this.isEditing);
  }
}