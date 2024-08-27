import type { Command } from './Command';

export class UpdateFontSizeCommand implements Command {
  constructor(private store: any, private fontSize: number) {}

  execute() {
    this.store.setFontSize(this.fontSize);
  }
}
