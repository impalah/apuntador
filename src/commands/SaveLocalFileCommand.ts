import type { Command } from './Command';
import logger from '@/core/logger'


export class SaveLocalFileCommand implements Command {
  constructor(private store: any) {}

  execute() {

    logger.info('Save local file clicked');

    // Create a new Blob with the content of the text area
    const content = this.store.textContent;
    const blob = new Blob([content], { type: 'text/plain' });

    // Create a new URL for the blob
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (this.store.openedFile ? this.store.openedFile.replace(/^file:\/\//, '') : 'untitled.txt'); // Default file name

    // Simulate a click on the anchor to start the download
    a.click();

    // Revoke the object URL to free up memory
    URL.revokeObjectURL(a.href);

  }

}