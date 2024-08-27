import type { Command } from './Command';

export class CommandInvoker {
  private commands: Command[] = [];

  addCommand(command: Command) {
    this.commands.push(command);
  }

  executeCommands() {
    this.commands.forEach(command => command.execute());
    this.commands = []; // Clear commands after execution
  }
}