/**
 * Log level utilities — maps between string names and numeric severity values.
 *
 * @module levels
 */

import type { LogLevel } from './types.js';
import { LogLevelValue } from './types.js';

/** Map a string level to its numeric severity. */
const LEVEL_VALUES: Record<LogLevel, LogLevelValue> = {
  debug: LogLevelValue.DEBUG,
  info: LogLevelValue.INFO,
  warn: LogLevelValue.WARN,
  error: LogLevelValue.ERROR,
  silent: LogLevelValue.SILENT,
};

/** Ordered list of actionable levels (excludes `silent`). */
export const LOG_LEVELS: readonly LogLevel[] = ['debug', 'info', 'warn', 'error'] as const;

/**
 * Return the numeric severity for a given log level string.
 *
 * @param level - A valid log level name.
 * @returns The corresponding {@link LogLevelValue}.
 */
export function levelToValue(level: LogLevel): LogLevelValue {
  return LEVEL_VALUES[level];
}

/**
 * Determine whether `level` meets or exceeds the `minLevel` threshold.
 *
 * @param level   - The level of the incoming log entry.
 * @param minLevel - The minimum level configured on the logger.
 * @returns `true` when the entry should be emitted.
 */
export function isLevelEnabled(level: LogLevel, minLevel: LogLevel): boolean {
  return LEVEL_VALUES[level] >= LEVEL_VALUES[minLevel];
}

/**
 * Infer a sensible default level from `NODE_ENV`.
 *
 * | NODE_ENV      | Level   |
 * |---------------|---------|
 * | `production`  | `error` |
 * | `staging`     | `warn`  |
 * | anything else | `debug` |
 */
export function levelFromEnv(): LogLevel {
  const env = typeof process !== 'undefined' ? process.env.NODE_ENV : undefined;
  switch (env) {
    case 'production':
      return 'error';
    case 'staging':
      return 'warn';
    default:
      return 'debug';
  }
}
