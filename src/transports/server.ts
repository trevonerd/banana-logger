/**
 * Server-side transport backed by **pino**.
 *
 * Automatically configures pino-pretty with banana emoji level indicators
 * when `json` mode is disabled (the default).
 *
 * The pretty-printer runs in a separate worker thread (pino's architecture).
 * All formatting functions live in `./pino-pretty-worker.ts` because
 * functions cannot be serialised across worker boundaries.
 *
 * @module transports/server
 */

import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import type { LogLevel, LogData, Transport } from '../types.js';

/**
 * Resolve the absolute path to the pino-pretty worker file.
 *
 * Uses `import.meta.url` so it works correctly in both source (ts) and
 * bundled (js) builds, and avoids the old `__dirname` footgun.
 */
function workerPath(): string {
  const thisDir = dirname(fileURLToPath(import.meta.url));
  return join(thisDir, 'pino-pretty-worker.js');
}

/**
 * Create a pino-backed server transport.
 *
 * @param level - Minimum log level.
 * @param json  - When `true`, emit raw JSON lines (no pretty-printing).
 * @returns A {@link Transport} that writes to stdout via pino.
 */
export async function createServerTransport(
  level: LogLevel,
  json: boolean,
): Promise<Transport> {
  const pino = (await import('pino')).default;

  const pinoOptions: Record<string, unknown> = { level };

  if (!json) {
    pinoOptions.transport = {
      target: workerPath(),
      options: {
        colorize: true,
      },
    };
  }

  const logger = pino(pinoOptions as Parameters<typeof pino>[0]);

  return {
    log(lvl: LogLevel, message: string, data?: LogData): void {
      if (data && Object.keys(data).length > 0) {
        logger[lvl](data, message);
      } else {
        logger[lvl](message);
      }
    },
    flush(): void {
      logger.flush();
    },
  };
}
