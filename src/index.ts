import path from 'node:path';
import pino from 'pino';
import { BananaCore } from './core/banana-core.ts';
import type { HighlightConfig, LogLevel } from './core/types.ts';

export type { GlobalConfig, HighlightConfig, LogCallback, LogLevel, LogOptions } from './core/types.ts';

class Banana extends BananaCore {
    private static instance: Banana;
    private logger: pino.Logger;

    private constructor() {
        super();
        const level = this.getMinLevel();
        const transport =
            process.env.NODE_ENV === 'test'
                ? undefined
                : {
                      target: path.join(__dirname, 'config', 'pino-pretty-transport.js'),
                      options: { colorize: true },
                      async: false,
                  };

        this.logger = pino({ level, transport });
        this.initMethods();
    }

    public static getInstance(): Banana {
        if (!Banana.instance) Banana.instance = new Banana();
        return Banana.instance;
    }

    protected output(level: LogLevel, message: string): void {
        const fn = (this.logger as unknown as Record<string, pino.LogFn>)[level];
        if (typeof fn !== 'function') {
            console.error(`Invalid log level: ${level}`);
            return;
        }
        fn.call(this.logger, message);
    }

    protected getMinLevel(): LogLevel {
        switch (process.env.NODE_ENV) {
            case 'production':
                return 'error';
            case 'staging':
                return 'warn';
            default:
                return 'debug';
        }
    }

    protected shouldShowCaller(): boolean {
        return process.env.NODE_ENV !== 'production';
    }

    protected applyHighlights(message: string, highlights: HighlightConfig[]): string {
        let highlighted = message;
        for (const { keyword, style } of highlights) {
            const regex = new RegExp(`(${keyword})`, 'gi');
            highlighted = highlighted.replace(regex, (match) => `\x1b[${style}m${match}\x1b[0m\x1b[39m`);
        }
        return highlighted;
    }

    protected formatGroupPrefix(stack: string[]): string {
        return `\x1b[34m${stack.join(' > ')}\x1b[0m >`;
    }
}

export default Banana.getInstance();
