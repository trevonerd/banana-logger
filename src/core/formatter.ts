import type { LogLevel } from './types.ts';

const emojiLevels: Record<LogLevel, string> = {
    debug: '\uD83D\uDC12',
    info: '\uD83C\uDF4C',
    warn: '\u26A0\uFE0F',
    error: '\uD83D\uDEA8',
};

const labelNames: Record<LogLevel, string> = {
    debug: 'DEBUG',
    info: 'INFO',
    warn: 'WARN',
    error: 'ERROR',
};

function pad(n: number): string {
    return n.toString().padStart(2, '0');
}

export function formatTimestamp(): string {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const HH = pad(d.getHours());
    const MM = pad(d.getMinutes());
    const ss = pad(d.getSeconds());
    const ms = d.getMilliseconds().toString().padStart(3, '0');
    return `[${yyyy}-${mm}-${dd} ${HH}:${MM}:${ss}.${ms}]`;
}

export function formatPrefix(level: LogLevel): string {
    const emoji = emojiLevels[level];
    const label = labelNames[level];
    const timestamp = formatTimestamp();
    return `\uD83D\uDD70  ${timestamp} ${emoji} ${label}:`;
}
