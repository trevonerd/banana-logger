/**
 * Message formatting — tags, details, metadata, groups, and keyword highlights.
 *
 * Pure functions with no side-effects, easy to test in isolation.
 *
 * @module formatter
 */

import type { HighlightRule, LogOptions } from './types.js';

/**
 * Return `true` when `value` is a syntactically valid HTTP(S) URL.
 *
 * @param value - The string to validate.
 */
export function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Apply ANSI highlight rules to a message string.
 *
 * Each matching keyword (case-insensitive) is wrapped with the corresponding
 * SGR escape code.
 *
 * @param message    - The raw log message.
 * @param highlights - An array of keyword/style rules to apply.
 * @returns The message with ANSI escape sequences inserted.
 */
export function applyHighlights(message: string, highlights: HighlightRule[]): string {
  let result = message;
  for (const { keyword, style } of highlights) {
    const regex = new RegExp(`(${escapeRegExp(keyword)})`, 'gi');
    result = result.replace(regex, `\x1b[${style}m$1\x1b[0m`);
  }
  return result;
}

/**
 * Build the fully-formatted log string from a raw message, per-call options,
 * global defaults, and the current group stack.
 *
 * @param message        - The raw log message from the caller.
 * @param options        - Per-call overrides (tag, details, metadata, highlights).
 * @param globalTag      - The globally configured tag.
 * @param globalDetails  - The globally configured details string.
 * @param globalMetadata - The globally configured metadata string.
 * @param globalHighlights - The globally configured highlight rules.
 * @param groupStack     - The current nesting path of active groups.
 * @returns The fully formatted, ready-to-print log string.
 */
export function formatMessage(
  message: string,
  options: LogOptions | undefined,
  globalTag: string,
  globalDetails: string,
  globalMetadata: string,
  globalHighlights: HighlightRule[],
  groupStack: readonly string[],
): string {
  const tag = options?.tag || globalTag;
  const details = options?.details || globalDetails;
  const metadata = options?.metadata || globalMetadata;
  const highlights = options?.highlights || globalHighlights;

  const groupPrefix =
    groupStack.length > 0
      ? `\x1b[34m${groupStack.join(' > ')}\x1b[0m >`
      : '';

  const metadataSegment = metadata
    ? isValidUrl(metadata)
      ? `(${metadata} 🔗)`
      : `[${metadata}]`
    : '';

  const parts = [
    groupPrefix,
    tag ? `[${tag}]` : '',
    details ? `[${details}]` : '',
    metadataSegment,
    message,
  ].filter(Boolean);

  let formatted = parts.join(' ');

  if (highlights.length > 0) {
    formatted = applyHighlights(formatted, highlights);
  }

  return formatted;
}

/** Escape special regex characters so they match literally. */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
