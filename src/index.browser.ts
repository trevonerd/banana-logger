import { BananaCore } from './core/banana-core.ts';
import { formatPrefix } from './core/formatter.ts';
import type { HighlightConfig, LogLevel } from './core/types.ts';

export type { GlobalConfig, HighlightConfig, LogCallback, LogLevel, LogOptions } from './core/types.ts';

class BananaBrowser extends BananaCore {
    private static instance: BananaBrowser;
    private minLevel: LogLevel = 'debug';

    private constructor() {
        super();
        this.initMethods();
    }

    public static getInstance(): BananaBrowser {
        if (!BananaBrowser.instance) BananaBrowser.instance = new BananaBrowser();
        return BananaBrowser.instance;
    }

    public setLevel(level: LogLevel): void {
        this.minLevel = level;
    }

    protected output(level: LogLevel, message: string): void {
        const prefix = formatPrefix(level);
        const consoleFn =
            level === 'debug'
                ? console.debug
                : level === 'warn'
                  ? console.warn
                  : level === 'error'
                    ? console.error
                    : console.info;
        consoleFn(`${prefix} ${message}`);
    }

    protected getMinLevel(): LogLevel {
        return this.minLevel;
    }

    protected shouldShowCaller(): boolean {
        return true;
    }

    protected applyHighlights(message: string, _highlights: HighlightConfig[]): string {
        return message;
    }

    protected formatGroupPrefix(stack: string[]): string {
        return `${stack.join(' > ')} >`;
    }
}

export default BananaBrowser.getInstance();
