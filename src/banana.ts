/**
 * Core Banana Logger — a hybrid client/server logger that adds 🍌 to your life.
 *
 * ## Architecture
 *
 * - **Transport-agnostic**: The {@link Banana} class delegates I/O to a
 *   {@link Transport} implementation. On the server it uses pino; in browsers
 *   it falls back to the native console.
 * - **Singleton by default**: {@link Banana.getInstance} returns a shared
 *   instance. Call {@link Banana.create} when you need an isolated logger
 *   (useful in tests or multi-tenant servers).
 * - **Fast**: Level checks happen *before* message formatting so disabled
 *   levels cost almost nothing.
 *
 * @module banana
 */

import type {
  BananaConfig,
  HighlightRule,
  LogCallback,
  LogData,
  LogLevel,
  LogOptions,
  Transport,
} from './types.js';
import { isLevelEnabled, levelFromEnv } from './levels.js';
import { formatMessage } from './formatter.js';
import { createBrowserTransport } from './transports/browser.js';

/**
 * Detect whether we are running in a server-like environment.
 *
 * Heuristic: `process.stdout` exists and is writable (Node / Bun).
 */
function detectIsServer(): boolean {
  return (
    typeof process !== 'undefined' &&
    typeof process.stdout !== 'undefined' &&
    typeof process.stdout.write === 'function'
  );
}

/**
 * The Banana Logger.
 *
 * @example
 * ```ts
 * import banana from 'banana-logger';
 *
 * banana.configure({ tag: 'APP' });
 * banana.info('Server started');                          // 🍌 INFO [APP] Server started
 * banana.warn('Disk full', { details: '/dev/sda1' });     // ⚠️  WARN [APP] [/dev/sda1] Disk full
 *
 * banana.time('db-query');
 * const rows = await db.query('SELECT ...');
 * banana.timeEnd('db-query');                             // 🍌 INFO [APP] db-query: 42.17ms
 *
 * banana.setLogCallback((level, msg) => sentry.addBreadcrumb({ level, message: msg }));
 * ```
 */
export class Banana {
  // ---------------------------------------------------------------------------
  // Singleton
  // ---------------------------------------------------------------------------

  private static instance: Banana | null = null;

  /**
   * Return the shared singleton instance. Created lazily on first access.
   *
   * The singleton auto-detects server vs. browser and picks the appropriate
   * transport. Override with {@link Banana.configure}.
   */
  public static getInstance(): Banana {
    if (!Banana.instance) {
      const b = new Banana();
      if (detectIsServer()) {
        b.initServerTransport();
      }
      Banana.instance = b;
    }
    return Banana.instance;
  }

  /**
   * Create a brand-new, independent logger.
   *
   * Useful for testing, multi-tenant servers, or when you need loggers with
   * different configurations side-by-side.
   *
   * By default uses the browser (console) transport. Pass
   * `{ transport: 'server' }` to explicitly use pino, or call
   * {@link getInstance} which auto-detects.
   *
   * @param config - Optional initial configuration.
   * @returns A new {@link Banana} instance.
   */
  public static create(config?: BananaConfig): Banana {
    const b = new Banana();
    if (config) b.configure(config);
    return b;
  }

  /**
   * Reset the singleton so the next {@link getInstance} call creates a fresh
   * logger. Primarily intended for tests.
   */
  public static resetInstance(): void {
    Banana.instance = null;
  }

  // ---------------------------------------------------------------------------
  // Instance state
  // ---------------------------------------------------------------------------

  private transport: Transport;
  private level: LogLevel;
  private logCallback: LogCallback | null = null;
  private globalTag = '';
  private globalDetails = '';
  private globalMetadata = '';
  private globalHighlights: HighlightRule[] = [];
  private timers: Map<string, number> = new Map();
  private groupStack: string[] = [];
  private transportReady: Promise<void> | null = null;
  private json = false;

  /** Private — use {@link getInstance} or {@link create}. */
  private constructor() {
    this.level = levelFromEnv();
    this.transport = createBrowserTransport();
  }

  // ---------------------------------------------------------------------------
  // Configuration
  // ---------------------------------------------------------------------------

  /**
   * Apply configuration to this logger. All fields are optional — only
   * provided keys are updated.
   *
   * @param config - The partial configuration to merge.
   *
   * @example
   * ```ts
   * banana.configure({ tag: 'API', level: 'warn', json: true });
   * ```
   */
  public configure(config: BananaConfig): void {
    if (config.level !== undefined) this.level = config.level;
    if (config.tag !== undefined) this.globalTag = config.tag;
    if (config.details !== undefined) this.globalDetails = config.details;
    if (config.metadata !== undefined) this.globalMetadata = config.metadata;
    if (config.highlights !== undefined) this.globalHighlights = config.highlights;
    if (config.json !== undefined) this.json = config.json;

    if (config.transport === 'server') {
      this.initServerTransport();
    } else if (config.transport === 'browser') {
      this.transport = createBrowserTransport();
      this.transportReady = null;
    }
  }

  /**
   * Reset **all** logger state back to defaults.
   *
   * Clears global configuration, active timers, group stack, and callbacks.
   */
  public reset(): void {
    this.globalTag = '';
    this.globalDetails = '';
    this.globalMetadata = '';
    this.globalHighlights = [];
    this.logCallback = null;
    this.timers.clear();
    this.groupStack.length = 0;
  }

  /**
   * Set a callback invoked on every log call (after transport output).
   *
   * Pass `null` to remove a previously set callback.
   *
   * @param callback - The function to call, or `null` to clear.
   *
   * @example
   * ```ts
   * banana.setLogCallback((level, message) => {
   *   telemetry.track('log', { level, message });
   * });
   * ```
   */
  public setLogCallback(callback: LogCallback | null): void {
    this.logCallback = callback;
  }

  // ---------------------------------------------------------------------------
  // Core logging
  // ---------------------------------------------------------------------------

  /**
   * Log a debug-level message.
   *
   * @param message - The log message.
   * @param options - Optional per-call overrides.
   * @param data    - Optional structured data attached to the entry.
   */
  public debug(message: string, options?: LogOptions, data?: LogData): void {
    this.emit('debug', message, options, data);
  }

  /**
   * Log an info-level message.
   *
   * @param message - The log message.
   * @param options - Optional per-call overrides.
   * @param data    - Optional structured data attached to the entry.
   */
  public info(message: string, options?: LogOptions, data?: LogData): void {
    this.emit('info', message, options, data);
  }

  /**
   * Alias for {@link info}. For developers who prefer `log()`.
   *
   * @param message - The log message.
   * @param options - Optional per-call overrides.
   * @param data    - Optional structured data attached to the entry.
   */
  public log(message: string, options?: LogOptions, data?: LogData): void {
    this.emit('info', message, options, data);
  }

  /**
   * Log a warning-level message.
   *
   * @param message - The log message.
   * @param options - Optional per-call overrides.
   * @param data    - Optional structured data attached to the entry.
   */
  public warn(message: string, options?: LogOptions, data?: LogData): void {
    this.emit('warn', message, options, data);
  }

  /**
   * Log an error-level message.
   *
   * @param message - The log message.
   * @param options - Optional per-call overrides.
   * @param data    - Optional structured data attached to the entry.
   */
  public error(message: string, options?: LogOptions, data?: LogData): void {
    this.emit('error', message, options, data);
  }

  // ---------------------------------------------------------------------------
  // Timing
  // ---------------------------------------------------------------------------

  /**
   * Start a named timer.
   *
   * @param label - Unique timer label.
   */
  public time(label: string): void {
    this.timers.set(label, performance.now());
  }

  /**
   * End a named timer and log the elapsed duration.
   *
   * @param label - The label passed to a previous {@link time} call.
   */
  public timeEnd(label: string): void {
    const start = this.timers.get(label);
    if (start === undefined) {
      this.warn(`Timer '${label}' does not exist`);
      return;
    }
    const duration = performance.now() - start;
    this.timers.delete(label);
    this.info(`${label}: ${duration.toFixed(2)}ms`);
  }

  /**
   * Measure the execution time of a promise or async function.
   *
   * @typeParam T    - The resolved type of the promise.
   * @param label    - Timer label.
   * @param fn       - A function returning a promise, or a promise directly.
   * @returns The resolved value of `fn`.
   *
   * @example
   * ```ts
   * const users = await banana.timePromise('fetch-users', () => api.getUsers());
   * ```
   */
  public async timePromise<T>(label: string, fn: (() => Promise<T>) | Promise<T>): Promise<T> {
    this.time(label);
    try {
      const result = await (typeof fn === 'function' ? fn() : fn);
      this.timeEnd(label);
      return result;
    } catch (error) {
      this.timeEnd(label);
      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // Grouping
  // ---------------------------------------------------------------------------

  /**
   * Start a named log group.
   *
   * All subsequent log messages will be prefixed with the group hierarchy
   * until {@link groupEnd} is called.
   *
   * @param label - The group name.
   */
  public groupStart(label: string): void {
    this.addBlankLine();
    this.groupStack.push(label);
    this.emitRaw('info', `----- START: ${label} ${''.padEnd(30, '-')}`);
  }

  /**
   * End the most recently started group.
   *
   * Logs a warning if no group is currently active.
   */
  public groupEnd(): void {
    if (this.groupStack.length === 0) {
      this.warn('Attempted to end a group, but no active group exists.');
      return;
    }
    const label = this.groupStack.pop()!;
    this.emitRaw('info', `----- END: ${label} ${''.padEnd(30, '-')}`);
    this.addBlankLine();
  }

  // ---------------------------------------------------------------------------
  // Utilities
  // ---------------------------------------------------------------------------

  /**
   * Display data in a tabular format via `console.table`.
   *
   * @param data - An array of objects or a single object to display.
   */
  public tab(data: unknown[] | Record<string, unknown>): void {
    if (data !== null && typeof data === 'object') {
      console.table(data);
    } else {
      this.info('Provided data is not an array or object.');
    }
  }

  /**
   * Emit an empty info line. Useful for visual separation in log output.
   */
  public addBlankLine(): void {
    this.emitRaw('info', '');
  }

  /**
   * Create a child logger that inherits this logger's transport and
   * configuration but has its own fixed tag.
   *
   * @param tag - The tag for the child logger.
   * @returns A new {@link Banana} instance pre-configured with the tag.
   *
   * @example
   * ```ts
   * const dbLog = banana.child('DB');
   * dbLog.info('Connection pool ready');  // 🍌 INFO [DB] Connection pool ready
   * ```
   */
  public child(tag: string): Banana {
    const child = Banana.create({
      level: this.level,
      tag,
      details: this.globalDetails,
      metadata: this.globalMetadata,
      highlights: [...this.globalHighlights],
    });
    child.transport = this.transport;
    child.transportReady = this.transportReady;
    child.logCallback = this.logCallback;
    return child;
  }

  /**
   * Flush any buffered output in the underlying transport.
   * Useful before process exit to ensure all logs are written.
   */
  public flush(): void {
    this.transport.flush?.();
  }

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  /** Format + level-gate + emit a log entry. */
  private emit(level: LogLevel, message: string, options?: LogOptions, data?: LogData): void {
    if (!isLevelEnabled(level, this.level)) return;

    try {
      const formatted = formatMessage(
        message,
        options,
        this.globalTag,
        this.globalDetails,
        this.globalMetadata,
        this.globalHighlights,
        this.groupStack,
      );

      this.transport.log(level, formatted, data);

      if (this.logCallback) {
        this.logCallback(level, formatted, options);
      }
    } catch (error) {
      console.error('Banana Logger: unexpected error while logging —', error);
    }
  }

  /** Emit a raw (pre-formatted) message, bypassing formatMessage. */
  private emitRaw(level: LogLevel, message: string): void {
    if (!isLevelEnabled(level, this.level)) return;
    try {
      this.transport.log(level, message);
    } catch (error) {
      console.error('Banana Logger: unexpected error while logging —', error);
    }
  }

  /** Lazily initialise the pino server transport. Falls back to browser transport on error. */
  private initServerTransport(): void {
    this.transportReady = (async () => {
      try {
        const { createServerTransport } = await import('./transports/server.js');
        this.transport = await createServerTransport(this.level, this.json);
      } catch {
        // Pino init can fail in test runners or restricted environments.
        // Keep the browser transport as a safe fallback.
      }
    })();
  }
}
