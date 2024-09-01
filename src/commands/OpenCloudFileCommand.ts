// src/commands/TogglePlayCommand.ts
import type { Command } from './Command';
import logger from '@/core/logger'


export class OpenCloudFileCommand implements Command {
  constructor(private store: any) {}

  execute() {
    logger.info('Open Cloud file clicked');

  }

}