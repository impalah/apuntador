// src/commands/ToggleMirrorCommand.ts
import type { Command } from './Command';

export class ToggleMirrorCommand implements Command {
  constructor(private store: any) {}

  execute() {
    this.store.toggleMirror();
  }
}