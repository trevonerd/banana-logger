/**
 * Core type definitions for Banana Logger.
 *
 * @module types
 */

/** Numeric severity used for fast level comparisons. Lower = more verbose. */
export const enum LogLevelValue {
  DEBUG = 10,
  INFO = 20,
  WARN = 30,
  ERROR = 40,
  SILENT = 99,
}

/** String log level identifiers. */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

/** ANSI highlight rule applied to matching keywords in log output. */
export interface HighlightRule {
  /** The keyword or phrase to match (case-insensitive). */
  keyword: string;
  /** ANSI SGR code — e.g. `'31'` for red, `'1;33'` for bold yellow. */
  style: string;
}

/** Per-call options that override global configuration for a single log. */
export interface LogOptions {
  /** Short tag shown in brackets, e.g. `[HTTP]`. */
  tag?: string;
  /** Detail string shown after the tag, e.g. `[v1.2.0]`. */
  details?: string;
  /** Metadata string — rendered as a clickable link when it's a valid URL. */
  metadata?: string;
  /** Keyword highlights applied to this message only. */
  highlights?: HighlightRule[];
}

/**
 * Callback invoked after every log call.
 * Useful for shipping logs to external services (Datadog, Sentry, etc.).
 */
export type LogCallback = (
  level: LogLevel,
  message: string,
  options?: LogOptions,
) => void;

/** Structured data attached to a log entry for JSON transports. */
export type LogData = Record<string, unknown>;

/** Global configuration applied to every log unless overridden per-call. */
export interface BananaConfig {
  /** Minimum log level. Messages below this severity are discarded. */
  level?: LogLevel;
  /** Global tag prepended to every message. */
  tag?: string;
  /** Global detail string. */
  details?: string;
  /** Global metadata string or URL. */
  metadata?: string;
  /** Global keyword highlights. */
  highlights?: HighlightRule[];
  /** Force a specific transport (`'server'` | `'browser'`). Auto-detected when omitted. */
  transport?: 'server' | 'browser';
  /** When `true`, output JSON instead of pretty-printed lines (server only). */
  json?: boolean;
}

/**
 * A transport receives formatted log entries and writes them to an output
 * destination (stdout via pino, the browser console, etc.).
 */
export interface Transport {
  /** Write a log entry at the given level. */
  log(level: LogLevel, message: string, data?: LogData): void;
  /** Flush any buffered output. */
  flush?(): void;
}
