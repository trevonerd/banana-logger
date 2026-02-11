import path from 'path';
import pino from 'pino';

const LogLevel = { DEBUG: 'debug', INFO: 'info', WARN: 'warn', ERROR: 'error' } as const;

export type LogLevel = typeof LogLevel[keyof typeof LogLevel];
export type HighlightConfig = { keyword: string; style: string };
export type LogOptions = {
    tag?: string;
    details?: string;
    metadata?: string;
    highlights?: HighlightConfig[];
    bananaCount?: number;
};
type LogCallback = (level: LogLevel, message: string, options?: LogOptions) => void;

type GlobalConfig = {
    tag: string;
    details: string;
    metadata: string;
    highlights: HighlightConfig[];
};

class Banana {
    private static instance: Banana;
    private logger: pino.Logger;
    private logCallback: LogCallback | null = null;
    private config: GlobalConfig = { tag: '', details: '', metadata: '', highlights: [] };
    private timers = new Map<string, number>();
    private groupStack: string[] = [];

    public debug!: (message: string, options?: LogOptions) => void;
    public info!: (message: string, options?: LogOptions) => void;
    public log!: (message: string, options?: LogOptions) => void;
    public warn!: (message: string, options?: LogOptions) => void;
    public error!: (message: string, options?: LogOptions) => void;

    private constructor() {
        const level = this.getLogLevelFromEnv();
        const transport = process.env.NODE_ENV === 'test'
            ? undefined
            : {
                target: path.join(__dirname, 'config', 'pino-pretty-transport.js'),
                options: { colorize: true },
                async: false,
            };

        this.logger = pino({ level, transport });

        this.debug = this.createLogMethod(LogLevel.DEBUG);
        this.info = this.createLogMethod(LogLevel.INFO);
        this.log = this.info;
        this.warn = this.createLogMethod(LogLevel.WARN);
        this.error = this.createLogMethod(LogLevel.ERROR);
    }

    public static getInstance(): Banana {
        if (!Banana.instance) Banana.instance = new Banana();
        return Banana.instance;
    }

    private getLogLevelFromEnv(): string {
        switch (process.env.NODE_ENV) {
            case 'production':
                return 'error';
            case 'staging':
                return 'warn';
            default:
                return 'debug';
        }
    }

    private isValidUrl(url: string): boolean {
        try {
            const parsedUrl = new URL(url);
            return ['http:', 'https:'].includes(parsedUrl.protocol) && !!parsedUrl.hostname;
        } catch {
            return false;
        }
    }

    private applyHighlights(message: string, highlights: HighlightConfig[]): string {
        let highlighted = message;
        for (const { keyword, style } of highlights) {
            const regex = new RegExp(`(${keyword})`, 'gi');
            highlighted = highlighted.replace(regex, match => `\x1b[${style}m${match}\x1b[0m\x1b[39m`);
        }
        return highlighted;
    }

    private getCaller(): string | null {
        const line = new Error().stack?.split('\n')[3];
        if (!line) return null;
        const match = line.match(/(?:at\s+.*\()?(.+):(\d+):\d+\)?$/);
        if (!match) return null;
        return `${path.basename(match[1])}:${match[2]}`;
    }

    private formatMessage(message: string, options?: LogOptions): string {
        const { tag, details, metadata, highlights } = { ...this.config, ...options };
        const groupPrefix = this.groupStack.length ? `\x1b[34m${this.groupStack.join(' > ')}\x1b[0m > ` : '';
        const clickableMetadata = metadata ? (this.isValidUrl(metadata) ? `(${metadata} 🔗)` : `[${metadata}]`) : '';
        const caller = process.env.NODE_ENV === 'production' ? '' : this.getCaller();
        const bananas = '🍌'.repeat(Math.max(1, options?.bananaCount ?? 1));

        const formatted = [
            groupPrefix,
            bananas,
            tag && `[${tag}]`,
            details && `[${details}]`,
            clickableMetadata,
            caller && `[${caller}]`,
            message,
        ].filter(Boolean).join(' ');

        return highlights.length ? this.applyHighlights(formatted, highlights) : formatted;
    }

    public addBlankLine(): void {
        this.logger.info('');
    }

    public groupStart(label: string): void {
        this.addBlankLine();
        this.groupStack.push(label);
        this.logger.info(`----- START: ${label} ${''.padEnd(30, '-')}`);
    }

    public groupEnd(): void {
        if (this.groupStack.length) {
            const label = this.groupStack.pop();
            this.logger.info(`----- END: ${label} ${''.padEnd(30, '-')}`);
            this.addBlankLine();
        } else {
            this.logger.warn('Attempted to end a group, but no active group exists.');
        }
    }

    private createLogMethod(level: LogLevel) {
        return (message: string, options?: LogOptions) => this.writeLog(level, message, options);
    }

    private writeLog(level: LogLevel, message: string, options?: LogOptions): void {
        try {
            const formatted = this.formatMessage(message, options);
            const fn = (this.logger as unknown as Record<string, pino.LogFn>)[level];
            if (typeof fn !== 'function') {
                console.error(`Invalid log level: ${level}`);
                return;
            }
            fn.call(this.logger, formatted);
            this.logCallback?.(level, formatted, options);
        } catch (error) {
            console.error('Logging error:', error);
        }
    }

    public setLogCallback(callback: LogCallback): void {
        this.logCallback = callback;
    }

    public configure(cfg: Partial<GlobalConfig>): void {
        this.config = { ...this.config, ...cfg };
    }

    public reset(): void {
        this.config = { tag: '', details: '', metadata: '', highlights: [] };
    }

    public tab(data: Array<unknown> | object): void {
        if (Array.isArray(data) || typeof data === 'object') console.table(data);
        else this.info('Provided data is not an array or object.');
    }

    public time(label: string): void {
        this.timers.set(label, performance.now());
    }

    public timeEnd(label: string): void {
        const start = this.timers.get(label);
        if (start === undefined) {
            this.warn(`Timer '${label}' does not exist`);
            return;
        }
        const duration = performance.now() - start;
        this.info(`${label}: ${duration.toFixed(2)}ms`);
        this.timers.delete(label);
    }

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
}

export default Banana.getInstance();
