/**
 * Press! Rules Engine - Contest Registry Setup
 *
 * Registers all MVP contest handlers with the default registry.
 */

import { defaultRegistry } from '../engine';
import { matchPlaySinglesHandler } from './match-play-singles';
import { nassauHandler } from './nassau';
import { skinsHandler } from './skins';
import { matchPlayBestballHandler } from './match-play-bestball';
import { bestballStrokeHandler } from './bestball-stroke';
import { stablefordHandler } from './stableford';
import { ctpHandler, longDriveHandler, birdiePoolHandler, snakeHandler } from './side-pots';

// Register all contest handlers
defaultRegistry.register(matchPlaySinglesHandler);
defaultRegistry.register(nassauHandler);
defaultRegistry.register(skinsHandler);
defaultRegistry.register(matchPlayBestballHandler);
defaultRegistry.register(bestballStrokeHandler);
defaultRegistry.register(stablefordHandler);
defaultRegistry.register(ctpHandler);
defaultRegistry.register(longDriveHandler);
defaultRegistry.register(birdiePoolHandler);
defaultRegistry.register(snakeHandler);

// Export handlers for direct use
export {
  matchPlaySinglesHandler,
  nassauHandler,
  skinsHandler,
  matchPlayBestballHandler,
  bestballStrokeHandler,
  stablefordHandler,
  ctpHandler,
  longDriveHandler,
  birdiePoolHandler,
  snakeHandler,
};
