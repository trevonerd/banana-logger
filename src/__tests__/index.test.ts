import { describe, expect, test, jest, beforeEach } from "bun:test";

import Banana, { LogLevel } from '../index';

describe('Banana', () => {
    let banana: typeof Banana;

    beforeEach(() => {
        banana = Banana;
        jest.clearAllMocks();
        banana.reset();
    });

    describe('Basic Logging', () => {
        test('should log debug message', () => {
            const loggerSpy = jest.spyOn(banana['logger'], 'debug').mockImplementation();
            banana.debug('Debug message');
            const call = loggerSpy.mock.calls[0][0];
            expect(call).toContain('Debug message');
            expect(call).toContain('🍌');
            loggerSpy.mockRestore();
        });

        test('should log log message', () => {
            const loggerSpy = jest.spyOn(banana['logger'], 'info').mockImplementation();
            banana.log('Info message');
            const call = loggerSpy.mock.calls[0][0];
            expect(call).toContain('Info message');
            expect(call).toContain('🍌');
            loggerSpy.mockRestore();
        });

        test('should log info message with caller info', () => {
            const loggerSpy = jest.spyOn(banana['logger'], 'info').mockImplementation();
            banana.info('Info message');
            const call = loggerSpy.mock.calls[0][0];
            expect(call).toContain('Info message');
            expect(call).toContain('🍌');
            expect(call).toMatch(/index\.test\.ts:\d+/);
            loggerSpy.mockRestore();
        });

        test('should log warn message', () => {
            const loggerSpy = jest.spyOn(banana['logger'], 'warn').mockImplementation();
            banana.warn('Warn message');
            const call = loggerSpy.mock.calls[0][0];
            expect(call).toContain('Warn message');
            expect(call).toContain('🍌');
            loggerSpy.mockRestore();
        });

        test('should log error message', () => {
            const loggerSpy = jest.spyOn(banana['logger'], 'error').mockImplementation();
            banana.error('Error message');
            const call = loggerSpy.mock.calls[0][0];
            expect(call).toContain('Error message');
            expect(call).toContain('🍌');
            loggerSpy.mockRestore();
        });

        test('should log invalid log level error', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            // @ts-expect-error accessing private method for testing
            banana['log']('invalid' as LogLevel, 'Test invalid log level');
            expect(consoleSpy).toHaveBeenCalledWith('Invalid log level: invalid');
            consoleSpy.mockRestore();
        });

        test('should handle log error in log method', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            const loggerSpy = jest.spyOn(banana['logger'], 'info').mockImplementation(() => { throw new Error('Test Error'); });
            banana.info('Test log error handling');
            expect(consoleSpy).toHaveBeenCalledWith('Logging error:', expect.any(Error));
            loggerSpy.mockRestore();
            consoleSpy.mockRestore();
        });
    });

    describe('Log Callbacks', () => {
        test('should handle log callback', () => {
            const callback = jest.fn();
            banana.setLogCallback(callback);
            banana.info('Info message with callback');
            expect(callback).toHaveBeenCalledWith('info', expect.any(String), undefined);
        });
    });

    describe('Grouped Logging', () => {
        test('should log group messages', () => {
            const loggerSpy = jest.spyOn(banana['logger'], 'info').mockImplementation();
            banana.groupStart('Group 1');
            banana.info('Inside group');
            banana.groupEnd();
            expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('----- START: Group 1'));
            expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('Inside group'));
            expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('----- END: Group 1'));
            loggerSpy.mockRestore();
        });

        test('should handle group stack correctly', () => {
            const loggerSpy = jest.spyOn(banana['logger'], 'info').mockImplementation();
            banana.groupStart('Group 1');
            banana.groupStart('Group 2');
            banana.info('Inside nested group');
            banana.groupEnd();
            banana.groupEnd();
            expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('----- START: Group 1'));
            expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('----- START: Group 2'));
            expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('Inside nested group'));
            expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('----- END: Group 2'));
            expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('----- END: Group 1'));
            loggerSpy.mockRestore();
        });

        test('should handle empty group stack on groupEnd', () => {
            const loggerSpy = jest.spyOn(banana['logger'], 'warn').mockImplementation();
            banana.groupEnd();
            expect(loggerSpy).toHaveBeenCalledWith('Attempted to end a group, but no active group exists.');
            loggerSpy.mockRestore();
        });
    });

    describe('Tabular Data Logging', () => {
        test('should log tabular data', () => {
            const consoleSpy = jest.spyOn(console, 'table').mockImplementation();
            const data = [{ name: 'Alice', age: 30 }, { name: 'Bob', age: 25 }];
            banana.tab(data);
            expect(consoleSpy).toHaveBeenCalledWith(data);
            consoleSpy.mockRestore();
        });

        test('should handle empty data in tab', () => {
            const consoleSpy = jest.spyOn(console, 'table').mockImplementation();
            banana.tab([]);
            expect(consoleSpy).toHaveBeenCalledWith([]);
            consoleSpy.mockRestore();
        });

        test('should log message when data is not an array or object in tab', () => {
            const loggerSpy = jest.spyOn(banana['logger'], 'info').mockImplementation();
            // @ts-expect-error Testing invalid input
            banana.tab('string data');
            expect(loggerSpy).toHaveBeenCalledWith('Provided data is not an array or object.');
            loggerSpy.mockRestore();
        });
    });

    describe('Timing Functions', () => {
        test('should start and end timer', () => {
            const loggerSpy = jest.spyOn(banana['logger'], 'info').mockImplementation();
            banana.time('testTimer');
            banana.timeEnd('testTimer');
            expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('testTimer:'));
            loggerSpy.mockRestore();
        });

        test('should handle non-existing timer end', () => {
            const loggerSpy = jest.spyOn(banana['logger'], 'warn').mockImplementation();
            banana.timeEnd('nonExistingTimer');
            expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('Timer \'nonExistingTimer\' does not exist'));
            loggerSpy.mockRestore();
        });

        test('should handle timePromise correctly', async () => {
            const loggerSpy = jest.spyOn(banana['logger'], 'info').mockImplementation();
            const testPromise = () => new Promise((resolve) => setTimeout(resolve, 100));
            await banana.timePromise('testPromise', testPromise);
            expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('testPromise:'));
            loggerSpy.mockRestore();
        });

        test('should handle both function and promise in timePromise', async () => {
            const loggerSpy = jest.spyOn(banana['logger'], 'info').mockImplementation();

            // Test with a function
            const testFunction = async () => {
                return 'function result';
            };
            const functionResult = await banana.timePromise('testFunction', testFunction);
            expect(functionResult).toBe('function result');
            expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('testFunction:'));

            // Test with a promise
            const testPromise = new Promise<string>((resolve) => setTimeout(() => resolve('promise result'), 100));
            const promiseResult = await banana.timePromise('testPromise', testPromise);
            expect(promiseResult).toBe('promise result');
            expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('testPromise:'));

            loggerSpy.mockRestore();
        });

        test('should handle error in timePromise', async () => {
            const loggerSpy = jest.spyOn(banana['logger'], 'info').mockImplementation();
            const errorFunction = async () => {
                return new Promise<void>((_, reject) => setTimeout(() => reject(new Error('Test Error')), 100));
            };

            await expect(banana.timePromise('errorFunction', errorFunction)).rejects.toThrow('Test Error');
            expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('errorFunction:'));
            loggerSpy.mockRestore();
        });
    });

    describe('Message Formatting', () => {
        test('should format message with options', () => {
            const loggerSpy = jest.spyOn(banana['logger'], 'info').mockImplementation();
            banana.info('Formatted message', { tag: 'TEST', details: 'details', metadata: 'metadata' });
            expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('[TEST]'));
            expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('[details]'));
            expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('[metadata]'));
            loggerSpy.mockRestore();
        });

        test('should format message with tag, details, and metadata', () => {
            const message = 'Test message';
            const options = { tag: 'TAG', details: 'DETAILS', metadata: 'METADATA' };
            const formattedMessage = banana['formatMessage'](message, options);
            expect(formattedMessage).toContain('[TAG]');
            expect(formattedMessage).toContain('[DETAILS]');
            expect(formattedMessage).toContain('[METADATA]');
            expect(formattedMessage).toContain('🍌');
            expect(formattedMessage).toContain('Test message');
        });

        test('should format message without tag', () => {
            const message = 'Test message';
            const options = { details: 'DETAILS', metadata: 'METADATA' };
            const formattedMessage = banana['formatMessage'](message, options);
            expect(formattedMessage).not.toContain('[TAG]');
            expect(formattedMessage).toContain('[DETAILS]');
            expect(formattedMessage).toContain('[METADATA]');
            expect(formattedMessage).toContain('🍌');
            expect(formattedMessage).toContain('Test message');
        });

        test('should format message without details', () => {
            const message = 'Test message';
            const options = { tag: 'TAG', metadata: 'METADATA' };
            const formattedMessage = banana['formatMessage'](message, options);
            expect(formattedMessage).toContain('[TAG]');
            expect(formattedMessage).not.toContain('[DETAILS]');
            expect(formattedMessage).toContain('[METADATA]');
            expect(formattedMessage).toContain('🍌');
            expect(formattedMessage).toContain('Test message');
        });

        test('should format message without metadata', () => {
            const message = 'Test message';
            const options = { tag: 'TAG', details: 'DETAILS' };
            const formattedMessage = banana['formatMessage'](message, options);
            expect(formattedMessage).toContain('[TAG]');
            expect(formattedMessage).toContain('[DETAILS]');
            expect(formattedMessage).not.toContain('[METADATA]');
            expect(formattedMessage).toContain('🍌');
            expect(formattedMessage).toContain('Test message');
        });

        test('should format message without tag, details, and metadata', () => {
            const message = 'Test message';
            const formattedMessage = banana['formatMessage'](message);
            expect(formattedMessage).toContain('Test message');
            expect(formattedMessage).toContain('🍌');
        });

        test('should log with global options', () => {
            banana.configure({ tag: 'GLOBAL', details: 'global details', metadata: 'global metadata' });
            const loggerSpy = jest.spyOn(banana['logger'], 'info').mockImplementation();
            banana.info('Test global options');
            const call = loggerSpy.mock.calls[0][0];
            expect(call).toContain('[GLOBAL]');
            expect(call).toContain('[global details]');
            expect(call).toContain('[global metadata]');
            expect(call).toContain('🍌');
            loggerSpy.mockRestore();
        });
    });

    describe('Configuration', () => {
        test('should configure global tag', () => {
            banana.configure({ tag: 'GLOBAL_TAG' });
            const message = 'Test message';
            const formattedMessage = banana['formatMessage'](message);
            expect(formattedMessage).toContain('[GLOBAL_TAG]');
            expect(formattedMessage).toContain('🍌');
        });

        test('should configure global details', () => {
            banana.configure({ details: 'GLOBAL_DETAILS' });
            const message = 'Test message';
            const formattedMessage = banana['formatMessage'](message);
            expect(formattedMessage).toContain('[GLOBAL_DETAILS]');
            expect(formattedMessage).toContain('🍌');
        });

        test('should configure global metadata', () => {
            banana.configure({ metadata: 'GLOBAL_METADATA' });
            const message = 'Test message';
            const formattedMessage = banana['formatMessage'](message);
            expect(formattedMessage).toContain('[GLOBAL_METADATA]');
            expect(formattedMessage).toContain('🍌');
        });

        test('should configure all global options', () => {
            banana.configure({ tag: 'GLOBAL_TAG', details: 'GLOBAL_DETAILS', metadata: 'GLOBAL_METADATA' });
            const message = 'Test message';
            const formattedMessage = banana['formatMessage'](message);
            expect(formattedMessage).toContain('[GLOBAL_TAG]');
            expect(formattedMessage).toContain('[GLOBAL_DETAILS]');
            expect(formattedMessage).toContain('[GLOBAL_METADATA]');
            expect(formattedMessage).toContain('🍌');
        });

        test('should override global tag with options', () => {
            banana.configure({ tag: 'GLOBAL_TAG' });
            const message = 'Test message';
            const options = { tag: 'LOCAL_TAG' };
            const formattedMessage = banana['formatMessage'](message, options);
            expect(formattedMessage).toContain('[LOCAL_TAG]');
            expect(formattedMessage).not.toContain('[GLOBAL_TAG]');
            expect(formattedMessage).toContain('🍌');
        });

        test('should override global details with options', () => {
            banana.configure({ details: 'GLOBAL_DETAILS' });
            const message = 'Test message';
            const options = { details: 'LOCAL_DETAILS' };
            const formattedMessage = banana['formatMessage'](message, options);
            expect(formattedMessage).toContain('[LOCAL_DETAILS]');
            expect(formattedMessage).not.toContain('[GLOBAL_DETAILS]');
            expect(formattedMessage).toContain('🍌');
        });

        test('should override global metadata with options', () => {
            banana.configure({ metadata: 'GLOBAL_METADATA' });
            const message = 'Test message';
            const options = { metadata: 'LOCAL_METADATA' };
            const formattedMessage = banana['formatMessage'](message, options);
            expect(formattedMessage).toContain('[LOCAL_METADATA]');
            expect(formattedMessage).not.toContain('[GLOBAL_METADATA]');
            expect(formattedMessage).toContain('🍌');
        });

        test('should override all global options with local options', () => {
            banana.configure({ tag: 'GLOBAL_TAG', details: 'GLOBAL_DETAILS', metadata: 'GLOBAL_METADATA' });
            const message = 'Test message';
            const options = { tag: 'LOCAL_TAG', details: 'LOCAL_DETAILS', metadata: 'LOCAL_METADATA' };
            const formattedMessage = banana['formatMessage'](message, options);
            expect(formattedMessage).toContain('[LOCAL_TAG]');
            expect(formattedMessage).toContain('[LOCAL_DETAILS]');
            expect(formattedMessage).toContain('[LOCAL_METADATA]');
            expect(formattedMessage).not.toContain('[GLOBAL_TAG]');
            expect(formattedMessage).not.toContain('[GLOBAL_DETAILS]');
            expect(formattedMessage).not.toContain('[GLOBAL_METADATA]');
            expect(formattedMessage).toContain('🍌');
        });
    });


});
