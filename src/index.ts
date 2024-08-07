import path from 'path';
import pino from 'pino';

const LogLevel = {
    DEBUG: 'debug',
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error'
} as const;

export type LogLevel = typeof LogLevel[keyof typeof LogLevel];
type LogOptions = { tag?: string; details?: string; metadata?: string; highlights?: HighlightConfig[] };
type LogCallback = (level: LogLevel, message: string, options?: LogOptions) => void;
type HighlightConfig = {
    keyword: string;
    style: string;
};

/**
 * Banana - An advanced logger with formatting, callback, timing, and highlighting capabilities.
 * 
 * @example
 * // Basic configuration
 * banana.configure({ tag: 'APP' });
 * 
 * // Simple logging
 * banana.info('Application started');
 * 
 * // Logging with options
 * banana.warn('Warning!', { details: 'Low memory', metadata: 'RAM: 80%' });
 * 
 * // Using timer
 * banana.time('operation');
 * // ... perform operation ...
 * banana.timeEnd('operation');
 * 
 * // Using callback
 * banana.setLogCallback((level, message, options) => {
 *   // Send log to external service
 * });
 * 
 * // Grouped logs
 * banana.groupStart('Initialization');
 * banana.debug('Loading modules...');
 * banana.groupEnd();
 * 
 * // Tabular data logging
 * banana.tab([{ name: 'Alice', age: 30 }, { name: 'Bob', age: 25 }]);
 * 
 * // Adding blank lines
 * banana.addBlankLine();
 * 
 * // Highlighting keywords
 * banana.configure({ highlights: [{ keyword: 'error', style: '31' }] });
 * banana.info('This is an error message that should be highlighted');
 * 
 * // Configuring with global metadata
 * banana.configure({ metadata: 'https://example.com' });
 * banana.info('This log entry includes clickable metadata');
 * 
 * // Resetting global configurations
 * banana.reset();
 * banana.info('This log entry should not include any global configuration');
 */

class Banana {
    private static instance: Banana;
    private logger: pino.Logger;
    private logCallback: LogCallback | null = null;
    private globalTag = '';
    private globalDetails = '';
    private globalMetadata = '';
    private globalHighlights: HighlightConfig[] = [];
    private timers: Record<string, number> = {};
    private groupStack: string[] = [];

    private constructor() {
        const level = this.getLogLevelFromEnv();
        this.logger = pino({
            level: level,
            transport: {
                target: path.join(__dirname, 'config', 'pino-pretty-transport.js'),
                options: {
                    colorize: true,
                }
            }
        });
    }

    public static getInstance(): Banana {
        if (!Banana.instance) {
            Banana.instance = new Banana();
        }
        return Banana.instance;
    }

    private getLogLevelFromEnv(): string {
        switch (process.env.NODE_ENV) {
            case 'production':
                return 'error';
            case 'staging':
                return 'warn';
            case 'development':
            default:
                return 'debug';
        }
    }

    private isValidUrl(url: string): boolean {
        try {
            const parsedUrl = new URL(url);
            return ['http:', 'https:'].includes(parsedUrl.protocol) && !!parsedUrl.hostname;
        } catch (_) {
            return false;
        }
    }

    private applyHighlights(message: string, highlights: HighlightConfig[]): string {
        let highlightedMessage = message;
        highlights.forEach(({ keyword, style }) => {
            const regex = new RegExp(`(${keyword})`, 'gi');
            highlightedMessage = highlightedMessage.replace(regex, (match) => `\x1b[${style}m${match}\x1b[0m\x1b[39m`);
        });
        return highlightedMessage;
    }

    private formatMessage(message: string, options?: LogOptions): string {
        const tag = options?.tag || this.globalTag;
        const details = options?.details || this.globalDetails;
        const metadata = options?.metadata || this.globalMetadata;
        const groupPrefix = this.groupStack.length > 0 ? `\x1b[34m${this.groupStack.join(' > ')}\x1b[0m > ` : '';
    
        const clickableMetadata = metadata ? this.isValidUrl(metadata) ? `(${metadata} 🔗)` : `[${metadata}]` : '';
    
        let formattedMessage = [
            groupPrefix,
            tag ? `[${tag}]` : '',
            details ? `[${details}]` : '',
            clickableMetadata,
            message,
        ].filter(Boolean).join(' ');
    
        const highlights = options?.highlights || this.globalHighlights || [];
        if (highlights.length > 0) {
            formattedMessage = this.applyHighlights(formattedMessage, highlights);
        }
    
        return formattedMessage;
    }
    

    public addBlankLine(): void {
        this.logger.info('');
    }

    public groupStart(label: string): void {
        this.addBlankLine();
        this.groupStack.push(label);
        const groupHeader = `----- START: ${label} ${''.padEnd(30, '-')}`;
        this.logger.info(groupHeader);
    }

    public groupEnd(): void {
        if (this.groupStack.length > 0) {
            const label = this.groupStack.pop();
            const groupFooter = `----- END: ${label} ${''.padEnd(30, '-')}`;
            this.logger.info(groupFooter);
            this.addBlankLine();
        } else {
            this.logger.warn('Attempted to end a group, but no active group exists.');
        }
    }

    private logWithErrorHandling(level: LogLevel, message: string, options?: LogOptions): void {
        try {
            const formattedMessage = this.formatMessage(message, options);
            const logFunction = this.getLogFunction(level);

            if (logFunction) {
                logFunction(formattedMessage);
            } else {
                console.error(`Invalid log level: ${level}`);
            }

            if (this.logCallback) this.logCallback(level, formattedMessage, options);
        } catch (error) {
            console.error('Logging error:', error);
        }
    }

    private getLogFunction(level: LogLevel): pino.LogFn | null {
        const logFunctions: Record<LogLevel, pino.LogFn> = {
            [LogLevel.DEBUG]: this.logger.debug.bind(this.logger),
            [LogLevel.INFO]: this.logger.info.bind(this.logger),
            [LogLevel.WARN]: this.logger.warn.bind(this.logger),
            [LogLevel.ERROR]: this.logger.error.bind(this.logger),
        };

        return logFunctions[level] || null;
    }

    public setLogCallback(callback: LogCallback): void {
        this.logCallback = callback;
    }

    public configure(cfg: { tag?: string; details?: string; metadata?: string; highlights?: HighlightConfig[] }): void {
        this.globalTag = cfg.tag || this.globalTag;
        this.globalDetails = cfg.details || this.globalDetails;
        this.globalMetadata = cfg.metadata || this.globalMetadata;
        this.globalHighlights = cfg.highlights || this.globalHighlights;
    }

    public reset(): void {
        this.globalTag = '';
        this.globalDetails = '';
        this.globalMetadata = '';
        this.globalHighlights = [];
    }

    public debug(message: string, options?: LogOptions): void {
        this.logWithErrorHandling(LogLevel.DEBUG, message, options);
    }

    public log(message: string, options?: LogOptions): void {
        this.logWithErrorHandling(LogLevel.INFO, message, options);
    }

    public info(message: string, options?: LogOptions): void {
        this.logWithErrorHandling(LogLevel.INFO, message, options);
    }

    public warn(message: string, options?: LogOptions): void {
        this.logWithErrorHandling(LogLevel.WARN, message, options);
    }

    public error(message: string, options?: LogOptions): void {
        this.logWithErrorHandling(LogLevel.ERROR, message, options);
    }

    public tab(data: Array<unknown> | object): void {
        if (Array.isArray(data) || typeof data === 'object') {
            console.table(data);
        } else {
            this.info('Provided data is not an array or object.');
        }
    }

    public time(label: string): void {
        this.timers[label] = performance.now();
    }

    public timeEnd(label: string): void {
        const endTime = performance.now();
        const startTime = this.timers[label];
        if (startTime === undefined) {
            this.warn(`Timer '${label}' does not exist`);
            return;
        }
        const duration = endTime - startTime;
        this.info(`${label}: ${duration.toFixed(2)}ms`);
        delete this.timers[label];
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
