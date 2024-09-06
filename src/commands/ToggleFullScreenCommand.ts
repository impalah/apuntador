import type { Command } from './Command';
import logger from '@/core/logger'



export class ToggleFullScreenCommand implements Command {
  execute() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        logger.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`)
      })
    } else {
      document.exitFullscreen()
    }
  }
}
