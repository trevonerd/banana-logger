/**
 * Browser / universal console transport.
 *
 * Zero dependencies — uses only the native `console` API, making it safe for
 * any JavaScript runtime (browsers, Deno, Bun, Cloudflare Workers, etc.).
 *
 * Every message is prefixed with the iconic banana emoji because logging
 * should make people happy.
 *
 * @module transports/browser
 */

import type { LogLevel, LogData, Transport } from '../types.js';

/** Emoji + label shown before every log line. */
const LEVEL_PREFIX: Record<string, string> = {
  debug: '🐒 DEBUG',
  info: '🍌 INFO',
  warn: '⚠️  WARN',
  error: '🚨 ERROR',
};

/**
 * Create a console-based browser transport.
 *
 * @returns A {@link Transport} that writes to the global `console`.
 */
export function createBrowserTransport(): Transport {
  return {
    log(level: LogLevel, message: string, data?: LogData): void {
      const prefix = LEVEL_PREFIX[level] ?? '🍌 LOG';
      const timestamp = new Date().toISOString();
      const line = `${prefix} [${timestamp}] ${message}`;

      const consoleFn = level === 'debug'
        ? console.debug
        : level === 'warn'
          ? console.warn
          : level === 'error'
            ? console.error
            : console.log;

      if (data && Object.keys(data).length > 0) {
        consoleFn(line, data);
      } else {
        consoleFn(line);
      }
    },
  };
}
