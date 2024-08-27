// src/commands/UpdateLateralMarginCommand.ts
import type { Command } from './Command';

export class UpdateLateralMarginCommand implements Command {
  constructor(private store: any, private lateralMargin: number) {}

  execute() {
    this.store.setLateralMargin(this.lateralMargin);
  }
}