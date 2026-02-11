import { beforeEach, describe, expect, jest, test } from 'bun:test';

import BananaBrowser from '../index.browser';

describe('BananaBrowser', () => {
    let banana: typeof BananaBrowser;

    beforeEach(() => {
        banana = BananaBrowser;
        jest.clearAllMocks();
        banana.reset();
    });

    describe('Basic Logging', () => {
        test('should log debug message via console.debug', () => {
            const spy = jest.spyOn(console, 'debug').mockImplementation();
            banana.debug('Debug message');
            expect(spy).toHaveBeenCalled();
            const call = spy.mock.calls[0][0] as string;
            expect(call).toContain('Debug message');
            expect(call).toContain('DEBUG');
            spy.mockRestore();
        });

        test('should log info message via console.info', () => {
            const spy = jest.spyOn(console, 'info').mockImplementation();
            banana.info('Info message');
            expect(spy).toHaveBeenCalled();
            const call = spy.mock.calls[0][0] as string;
            expect(call).toContain('Info message');
            expect(call).toContain('INFO');
            spy.mockRestore();
        });

        test('should log warn message via console.warn', () => {
            const spy = jest.spyOn(console, 'warn').mockImplementation();
            banana.warn('Warn message');
            expect(spy).toHaveBeenCalled();
            const call = spy.mock.calls[0][0] as string;
            expect(call).toContain('Warn message');
            expect(call).toContain('WARN');
            spy.mockRestore();
        });

        test('should log error message via console.error', () => {
            const spy = jest.spyOn(console, 'error').mockImplementation();
            banana.error('Error message');
            expect(spy).toHaveBeenCalled();
            const call = spy.mock.calls[0][0] as string;
            expect(call).toContain('Error message');
            expect(call).toContain('ERROR');
            spy.mockRestore();
        });

        test('should include banana emoji in messages', () => {
            const spy = jest.spyOn(console, 'info').mockImplementation();
            banana.info('Test bananas');
            const call = spy.mock.calls[0][0] as string;
            expect(call).toContain('\uD83C\uDF4C');
            spy.mockRestore();
        });

        test('should include timestamp in output', () => {
            const spy = jest.spyOn(console, 'info').mockImplementation();
            banana.info('Test timestamp');
            const call = spy.mock.calls[0][0] as string;
            expect(call).toMatch(/\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}\]/);
            spy.mockRestore();
        });
    });

    describe('Log Callbacks', () => {
        test('should handle log callback', () => {
            const spy = jest.spyOn(console, 'info').mockImplementation();
            const callback = jest.fn();
            banana.setLogCallback(callback);
            banana.info('Callback test');
            expect(callback).toHaveBeenCalledWith('info', expect.any(String), undefined);
            spy.mockRestore();
        });
    });

    describe('Configuration', () => {
        test('should format message with tag', () => {
            const spy = jest.spyOn(console, 'info').mockImplementation();
            banana.info('Test', { tag: 'TAG' });
            const call = spy.mock.calls[0][0] as string;
            expect(call).toContain('[TAG]');
            spy.mockRestore();
        });

        test('should configure global options', () => {
            const spy = jest.spyOn(console, 'info').mockImplementation();
            banana.configure({ tag: 'GLOBAL', details: 'details' });
            banana.info('Test');
            const call = spy.mock.calls[0][0] as string;
            expect(call).toContain('[GLOBAL]');
            expect(call).toContain('[details]');
            spy.mockRestore();
        });
    });

    describe('Level filtering', () => {
        test('should respect setLevel', () => {
            const debugSpy = jest.spyOn(console, 'debug').mockImplementation();
            const infoSpy = jest.spyOn(console, 'info').mockImplementation();
            const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

            banana.setLevel('warn');
            banana.debug('should not appear');
            banana.info('should not appear');
            banana.warn('should appear');

            expect(debugSpy).not.toHaveBeenCalled();
            expect(infoSpy).not.toHaveBeenCalled();
            expect(warnSpy).toHaveBeenCalled();

            // Reset to default
            banana.setLevel('debug');
            debugSpy.mockRestore();
            infoSpy.mockRestore();
            warnSpy.mockRestore();
        });
    });

    describe('Grouped Logging', () => {
        test('should log group messages', () => {
            const spy = jest.spyOn(console, 'info').mockImplementation();
            banana.groupStart('Group 1');
            banana.info('Inside group');
            banana.groupEnd();
            const calls = spy.mock.calls.map((c) => c[0] as string);
            expect(calls.some((c) => c.includes('----- START: Group 1'))).toBe(true);
            expect(calls.some((c) => c.includes('Inside group'))).toBe(true);
            expect(calls.some((c) => c.includes('----- END: Group 1'))).toBe(true);
            spy.mockRestore();
        });

        test('should use plain text group prefix (no ANSI)', () => {
            const spy = jest.spyOn(console, 'info').mockImplementation();
            banana.groupStart('MyGroup');
            banana.info('Inside');
            const calls = spy.mock.calls.map((c) => c[0] as string);
            const insideCall = calls.find((c) => c.includes('Inside'));
            expect(insideCall).toContain('MyGroup >');
            expect(insideCall).not.toContain('\x1b[');
            spy.mockRestore();
            banana.groupEnd();
        });
    });

    describe('Highlights noop', () => {
        test('should not apply ANSI codes for highlights', () => {
            const spy = jest.spyOn(console, 'info').mockImplementation();
            banana.info('error message', { highlights: [{ keyword: 'error', style: '31' }] });
            const call = spy.mock.calls[0][0] as string;
            expect(call).toContain('error message');
            expect(call).not.toContain('\x1b[');
            spy.mockRestore();
        });
    });

    describe('Timing Functions', () => {
        test('should start and end timer', () => {
            const spy = jest.spyOn(console, 'info').mockImplementation();
            banana.time('testTimer');
            banana.timeEnd('testTimer');
            const calls = spy.mock.calls.map((c) => c[0] as string);
            expect(calls.some((c) => c.includes('testTimer:'))).toBe(true);
            spy.mockRestore();
        });
    });
});
