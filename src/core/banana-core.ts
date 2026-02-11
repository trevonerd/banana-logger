import { getCaller } from './caller.ts';
import type { GlobalConfig, HighlightConfig, LogCallback, LogOptions } from './types.ts';
import { LogLevel } from './types.ts';

export abstract class BananaCore {
    protected logCallback: LogCallback | null = null;
    protected config: GlobalConfig = { tag: '', details: '', metadata: '', highlights: [] };
    protected timers = new Map<string, number>();
    protected groupStack: string[] = [];

    public debug!: (message: string, options?: LogOptions) => void;
    public info!: (message: string, options?: LogOptions) => void;
    public log!: (message: string, options?: LogOptions) => void;
    public warn!: (message: string, options?: LogOptions) => void;
    public error!: (message: string, options?: LogOptions) => void;

    protected initMethods(): void {
        this.debug = this.createLogMethod(LogLevel.DEBUG);
        this.info = this.createLogMethod(LogLevel.INFO);
        this.log = this.info;
        this.warn = this.createLogMethod(LogLevel.WARN);
        this.error = this.createLogMethod(LogLevel.ERROR);
    }

    protected abstract output(level: LogLevel, message: string): void;
    protected abstract getMinLevel(): LogLevel;
    protected abstract shouldShowCaller(): boolean;
    protected abstract applyHighlights(message: string, highlights: HighlightConfig[]): string;
    protected abstract formatGroupPrefix(stack: string[]): string;

    private isValidUrl(url: string): boolean {
        try {
            const parsedUrl = new URL(url);
            return ['http:', 'https:'].includes(parsedUrl.protocol) && !!parsedUrl.hostname;
        } catch {
            return false;
        }
    }

    protected formatMessage(message: string, options?: LogOptions): string {
        const { tag, details, metadata, highlights } = { ...this.config, ...options };
        const groupPrefix = this.groupStack.length ? this.formatGroupPrefix(this.groupStack) : '';
        const clickableMetadata = metadata
            ? this.isValidUrl(metadata)
                ? `(${metadata} \uD83D\uDD17)`
                : `[${metadata}]`
            : '';
        const caller = this.shouldShowCaller() ? getCaller() : '';
        const bananas = '\uD83C\uDF4C'.repeat(Math.max(1, options?.bananaCount ?? 1));

        const formatted = [
            groupPrefix,
            bananas,
            tag && `[${tag}]`,
            details && `[${details}]`,
            clickableMetadata,
            caller && `[${caller}]`,
            message,
        ]
            .filter(Boolean)
            .join(' ');

        return highlights.length ? this.applyHighlights(formatted, highlights) : formatted;
    }

    private static readonly levelOrder: LogLevel[] = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];

    private shouldLog(level: LogLevel): boolean {
        const minIdx = BananaCore.levelOrder.indexOf(this.getMinLevel());
        const curIdx = BananaCore.levelOrder.indexOf(level);
        if (curIdx === -1) return true;
        return curIdx >= minIdx;
    }

    protected writeLog(level: LogLevel, message: string, options?: LogOptions): void {
        try {
            if (!this.shouldLog(level)) return;
            const formatted = this.formatMessage(message, options);
            this.output(level, formatted);
            this.logCallback?.(level, formatted, options);
        } catch (error) {
            console.error('Logging error:', error);
        }
    }

    private createLogMethod(level: LogLevel) {
        return (message: string, options?: LogOptions) => this.writeLog(level, message, options);
    }

    public addBlankLine(): void {
        this.output(LogLevel.INFO, '');
    }

    public groupStart(label: string): void {
        this.addBlankLine();
        this.groupStack.push(label);
        this.output(LogLevel.INFO, `----- START: ${label} ${''.padEnd(30, '-')}`);
    }

    public groupEnd(): void {
        if (this.groupStack.length) {
            const label = this.groupStack.pop();
            this.output(LogLevel.INFO, `----- END: ${label} ${''.padEnd(30, '-')}`);
            this.addBlankLine();
        } else {
            this.output(LogLevel.WARN, 'Attempted to end a group, but no active group exists.');
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
