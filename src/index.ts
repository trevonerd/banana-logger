/**
 * # Banana Logger 🍌
 *
 * A hybrid client/server TypeScript logger that adds banana emojis to your
 * logs and happiness to your day.
 *
 * ## Quick start
 *
 * ```ts
 * import banana from 'banana-logger';
 *
 * banana.info('Hello world!');   // 🍌 INFO Hello world!
 * ```
 *
 * ## Advanced usage
 *
 * ```ts
 * import { Banana } from 'banana-logger';
 *
 * const log = Banana.create({ tag: 'WORKER', level: 'warn' });
 * log.warn('Retrying…');
 * ```
 *
 * @packageDocumentation
 */

export { Banana } from './banana.js';
export type {
  BananaConfig,
  HighlightRule,
  LogCallback,
  LogData,
  LogLevel,
  LogOptions,
  Transport,
} from './types.js';
export { isLevelEnabled, levelFromEnv, LOG_LEVELS } from './levels.js';
export { formatMessage, applyHighlights, isValidUrl } from './formatter.js';
export { createBrowserTransport } from './transports/browser.js';

// Default export — the singleton instance, ready to use.
import { Banana } from './banana.js';

/**
 * The default singleton Banana Logger instance.
 *
 * Auto-detects server vs. browser and picks the appropriate transport.
 *
 * @example
 * ```ts
 * import banana from 'banana-logger';
 * banana.info('ready!');
 * ```
 */
const banana = Banana.getInstance();
export default banana;
