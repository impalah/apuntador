// src/commands/TogglePlayCommand.ts
import type { Command } from './Command';
import logger from '@/core/logger'


export class OpenLocalFileCommand implements Command {
  constructor(private store: any) {}

  execute() {

    logger.info('Open file clicked');

    // Create and input of file type
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.md'; // TODO: Add more file types

    // Manage the change event
    input.onchange = async (event: Event) => {
      const target = event.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        const file = target.files[0];
        const reader = new FileReader();

        reader.onload = () => {
          const content = reader.result as string;
          this.store.setTextContent(content);
        };

        reader.onerror = () => {
          logger.error('Error reading file');
        };

        reader.readAsText(file); // Read the file as text
      } else {
        logger.info('No file selected or operation cancelled');
      }
    };

    // Simulate a click on the input to open the file dialog
    input.click();
  }

}