export const LogLevel = { DEBUG: 'debug', INFO: 'info', WARN: 'warn', ERROR: 'error' } as const;

export type LogLevel = (typeof LogLevel)[keyof typeof LogLevel];
export type HighlightConfig = { keyword: string; style: string };
export type LogOptions = {
    tag?: string;
    details?: string;
    metadata?: string;
    highlights?: HighlightConfig[];
    bananaCount?: number;
};
export type LogCallback = (level: LogLevel, message: string, options?: LogOptions) => void;

export type GlobalConfig = {
    tag: string;
    details: string;
    metadata: string;
    highlights: HighlightConfig[];
};
