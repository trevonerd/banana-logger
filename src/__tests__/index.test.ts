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
            expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('Debug message'));
            loggerSpy.mockRestore();
        });

        test('should log log message', () => {
            const loggerSpy = jest.spyOn(banana['logger'], 'info').mockImplementation();
            banana.log('Info message');
            expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('Info message'));
            loggerSpy.mockRestore();
        });

        test('should log info message', () => {
            const loggerSpy = jest.spyOn(banana['logger'], 'info').mockImplementation();
            banana.info('Info message');
            expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('Info message'));
            loggerSpy.mockRestore();
        });

        test('should log warn message', () => {
            const loggerSpy = jest.spyOn(banana['logger'], 'warn').mockImplementation();
            banana.warn('Warn message');
            expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('Warn message'));
            loggerSpy.mockRestore();
        });

        test('should log error message', () => {
            const loggerSpy = jest.spyOn(banana['logger'], 'error').mockImplementation();
            banana.error('Error message');
            expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('Error message'));
            loggerSpy.mockRestore();
        });

        test('should log invalid log level error', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            banana['logWithErrorHandling']('invalid' as LogLevel, 'Test invalid log level');
            expect(consoleSpy).toHaveBeenCalledWith('Invalid log level: invalid');
            consoleSpy.mockRestore();
        });

        test('should handle log error in logWithErrorHandling', () => {
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
            const expectedOutput = '[TAG] [DETAILS] [METADATA] Test message';

            const formattedMessage = banana['formatMessage'](message, options);
            expect(formattedMessage).toBe(expectedOutput);
        });

        test('should format message without tag', () => {
            const message = 'Test message';
            const options = { details: 'DETAILS', metadata: 'METADATA' };
            const expectedOutput = '[DETAILS] [METADATA] Test message';

            const formattedMessage = banana['formatMessage'](message, options);
            expect(formattedMessage).toBe(expectedOutput);
        });

        test('should format message without details', () => {
            const message = 'Test message';
            const options = { tag: 'TAG', metadata: 'METADATA' };
            const expectedOutput = '[TAG] [METADATA] Test message';

            const formattedMessage = banana['formatMessage'](message, options);
            expect(formattedMessage).toBe(expectedOutput);
        });

        test('should format message without metadata', () => {
            const message = 'Test message';
            const options = { tag: 'TAG', details: 'DETAILS' };
            const expectedOutput = '[TAG] [DETAILS] Test message';

            const formattedMessage = banana['formatMessage'](message, options);
            expect(formattedMessage).toBe(expectedOutput);
        });

        test('should format message without tag, details, and metadata', () => {
            const message = 'Test message';
            const expectedOutput = 'Test message';

            const formattedMessage = banana['formatMessage'](message);
            expect(formattedMessage).toBe(expectedOutput);
        });

        test('should log with global options', () => {
            banana.configure({ tag: 'GLOBAL', details: 'global details', metadata: 'global metadata' });
            const loggerSpy = jest.spyOn(banana['logger'], 'info').mockImplementation();
            banana.info('Test global options');
            expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('[GLOBAL]'));
            expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('[global details]'));
            expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('[global metadata]'));
            loggerSpy.mockRestore();
        });
    });

    describe('Configuration', () => {
        test('should configure global tag', () => {
            banana.configure({ tag: 'GLOBAL_TAG' });
            const message = 'Test message';
            const expectedOutput = '[GLOBAL_TAG] Test message';

            const formattedMessage = banana['formatMessage'](message);
            expect(formattedMessage).toBe(expectedOutput);
        });

        test('should configure global details', () => {
            banana.configure({ details: 'GLOBAL_DETAILS' });
            const message = 'Test message';
            const expectedOutput = '[GLOBAL_DETAILS] Test message';

            const formattedMessage = banana['formatMessage'](message);
            expect(formattedMessage).toBe(expectedOutput);
        });

        test('should configure global metadata', () => {
            banana.configure({ metadata: 'GLOBAL_METADATA' });
            const message = 'Test message';
            const expectedOutput = '[GLOBAL_METADATA] Test message';

            const formattedMessage = banana['formatMessage'](message);
            expect(formattedMessage).toBe(expectedOutput);
        });

        test('should configure all global options', () => {
            banana.configure({ tag: 'GLOBAL_TAG', details: 'GLOBAL_DETAILS', metadata: 'GLOBAL_METADATA' });
            const message = 'Test message';
            const expectedOutput = '[GLOBAL_TAG] [GLOBAL_DETAILS] [GLOBAL_METADATA] Test message';

            const formattedMessage = banana['formatMessage'](message);
            expect(formattedMessage).toBe(expectedOutput);
        });

        test('should override global tag with options', () => {
            banana.configure({ tag: 'GLOBAL_TAG' });
            const message = 'Test message';
            const options = { tag: 'LOCAL_TAG' };
            const expectedOutput = '[LOCAL_TAG] Test message';

            const formattedMessage = banana['formatMessage'](message, options);
            expect(formattedMessage).toBe(expectedOutput);
        });

        test('should override global details with options', () => {
            banana.configure({ details: 'GLOBAL_DETAILS' });
            const message = 'Test message';
            const options = { details: 'LOCAL_DETAILS' };
            const expectedOutput = '[LOCAL_DETAILS] Test message';

            const formattedMessage = banana['formatMessage'](message, options);
            expect(formattedMessage).toBe(expectedOutput);
        });

        test('should override global metadata with options', () => {
            banana.configure({ metadata: 'GLOBAL_METADATA' });
            const message = 'Test message';
            const options = { metadata: 'LOCAL_METADATA' };
            const expectedOutput = '[LOCAL_METADATA] Test message';

            const formattedMessage = banana['formatMessage'](message, options);
            expect(formattedMessage).toBe(expectedOutput);
        });

        test('should override all global options with local options', () => {
            banana.configure({ tag: 'GLOBAL_TAG', details: 'GLOBAL_DETAILS', metadata: 'GLOBAL_METADATA' });
            const message = 'Test message';
            const options = { tag: 'LOCAL_TAG', details: 'LOCAL_DETAILS', metadata: 'LOCAL_METADATA' };
            const expectedOutput = '[LOCAL_TAG] [LOCAL_DETAILS] [LOCAL_METADATA] Test message';

            const formattedMessage = banana['formatMessage'](message, options);
            expect(formattedMessage).toBe(expectedOutput);
        });
    });


});