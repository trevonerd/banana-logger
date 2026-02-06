/**
 * Pino-pretty transport worker.
 *
 * This file is loaded by pino in a worker thread. It must export a default
 * function that returns a writable stream (the pino-pretty contract).
 *
 * Functions cannot be serialised across worker threads, so all prettifier
 * logic lives here rather than in the transport options object.
 *
 * @module transports/pino-pretty-worker
 */

import PinoPretty from 'pino-pretty';

/** Emoji prefixes shown in pretty-printed server output. */
const LEVEL_EMOJI = {
  20: '🐒',
  30: '🍌',
  40: '⚠️',
  50: '🚨',
};

export default (opts) =>
  PinoPretty({
    ...opts,
    translateTime: '[yyyy-mm-dd HH:MM:ss.l]',
    customPrettifiers: {
      time: (timestamp) => `🕰  ${timestamp}`,
      level: (logLevel, _key, _log, { labelColorized }) =>
        `${LEVEL_EMOJI[logLevel] ?? '🍌'} ${labelColorized}`,
    },
  });
