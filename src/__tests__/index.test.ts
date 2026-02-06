import { describe, expect, test, jest, beforeEach } from 'bun:test';
import {
  Banana,
  formatMessage,
  applyHighlights,
  isValidUrl,
  isLevelEnabled,
  levelFromEnv,
  LOG_LEVELS,
  createBrowserTransport,
} from '../index';
import type { LogLevel, LogOptions, Transport } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a spy transport that records every call. */
function spyTransport(): Transport & { calls: Array<{ level: LogLevel; message: string; data?: Record<string, unknown> }> } {
  const calls: Array<{ level: LogLevel; message: string; data?: Record<string, unknown> }> = [];
  return {
    calls,
    log(level: LogLevel, message: string, data?: Record<string, unknown>) {
      calls.push({ level, message, data });
    },
  };
}

/** Inject a custom transport into a Banana instance (test-only). */
function injectTransport(banana: Banana, transport: Transport): void {
  // Access private field for testing purposes.
  (banana as unknown as { transport: Transport }).transport = transport;
}

// ---------------------------------------------------------------------------
// Formatter (pure functions)
// ---------------------------------------------------------------------------

describe('formatter', () => {
  describe('isValidUrl', () => {
    test('accepts http urls', () => {
      expect(isValidUrl('http://example.com')).toBe(true);
    });

    test('accepts https urls', () => {
      expect(isValidUrl('https://example.com/path?q=1')).toBe(true);
    });

    test('rejects ftp urls', () => {
      expect(isValidUrl('ftp://files.example.com')).toBe(false);
    });

    test('rejects plain strings', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
    });

    test('rejects empty strings', () => {
      expect(isValidUrl('')).toBe(false);
    });
  });

  describe('applyHighlights', () => {
    test('wraps matching keywords with ANSI codes', () => {
      const result = applyHighlights('an error occurred', [{ keyword: 'error', style: '31' }]);
      expect(result).toContain('\x1b[31m');
      expect(result).toContain('error');
      expect(result).toContain('\x1b[0m');
    });

    test('is case-insensitive', () => {
      const result = applyHighlights('ERROR happened', [{ keyword: 'error', style: '31' }]);
      expect(result).toContain('\x1b[31m');
    });

    test('handles multiple highlight rules', () => {
      const result = applyHighlights('error and warning', [
        { keyword: 'error', style: '31' },
        { keyword: 'warning', style: '33' },
      ]);
      expect(result).toContain('\x1b[31m');
      expect(result).toContain('\x1b[33m');
    });

    test('returns original message when no rules match', () => {
      const result = applyHighlights('all good', [{ keyword: 'error', style: '31' }]);
      expect(result).toBe('all good');
    });

    test('escapes special regex characters in keywords', () => {
      const result = applyHighlights('price is $100.00', [{ keyword: '$100.00', style: '32' }]);
      expect(result).toContain('\x1b[32m');
    });
  });

  describe('formatMessage', () => {
    test('returns plain message when no options or globals', () => {
      expect(formatMessage('hello', undefined, '', '', '', [], [])).toBe('hello');
    });

    test('prepends tag in brackets', () => {
      expect(formatMessage('msg', { tag: 'API' }, '', '', '', [], [])).toBe('[API] msg');
    });

    test('prepends details', () => {
      expect(formatMessage('msg', { details: 'v2' }, '', '', '', [], [])).toBe('[v2] msg');
    });

    test('prepends metadata in brackets when not a url', () => {
      expect(formatMessage('msg', { metadata: 'extra' }, '', '', '', [], [])).toBe('[extra] msg');
    });

    test('renders metadata as clickable link when it is a url', () => {
      const result = formatMessage('msg', { metadata: 'https://x.com' }, '', '', '', [], []);
      expect(result).toContain('(https://x.com 🔗)');
    });

    test('combines tag + details + metadata + message', () => {
      const result = formatMessage('hi', { tag: 'T', details: 'D', metadata: 'M' }, '', '', '', [], []);
      expect(result).toBe('[T] [D] [M] hi');
    });

    test('uses global defaults when per-call options are absent', () => {
      const result = formatMessage('msg', undefined, 'GTAG', 'GDET', 'GMETA', [], []);
      expect(result).toBe('[GTAG] [GDET] [GMETA] msg');
    });

    test('per-call options override globals', () => {
      const result = formatMessage('msg', { tag: 'LOCAL' }, 'GLOBAL', '', '', [], []);
      expect(result).toBe('[LOCAL] msg');
    });

    test('includes group prefix when groupStack is non-empty', () => {
      const result = formatMessage('msg', undefined, '', '', '', [], ['G1', 'G2']);
      expect(result).toContain('G1 > G2');
      expect(result).toContain('msg');
    });

    test('applies highlight rules', () => {
      const result = formatMessage('an error', undefined, '', '', '', [{ keyword: 'error', style: '31' }], []);
      expect(result).toContain('\x1b[31m');
    });
  });
});

// ---------------------------------------------------------------------------
// Levels
// ---------------------------------------------------------------------------

describe('levels', () => {
  test('LOG_LEVELS contains the four actionable levels', () => {
    expect(LOG_LEVELS).toEqual(['debug', 'info', 'warn', 'error']);
  });

  test('isLevelEnabled allows same level', () => {
    expect(isLevelEnabled('info', 'info')).toBe(true);
  });

  test('isLevelEnabled allows higher level', () => {
    expect(isLevelEnabled('error', 'info')).toBe(true);
  });

  test('isLevelEnabled rejects lower level', () => {
    expect(isLevelEnabled('debug', 'info')).toBe(false);
  });

  test('isLevelEnabled silent blocks everything', () => {
    expect(isLevelEnabled('error', 'silent')).toBe(false);
  });

  test('levelFromEnv returns debug by default', () => {
    const original = process.env.NODE_ENV;
    delete process.env.NODE_ENV;
    expect(levelFromEnv()).toBe('debug');
    process.env.NODE_ENV = original;
  });
});

// ---------------------------------------------------------------------------
// Browser transport
// ---------------------------------------------------------------------------

describe('createBrowserTransport', () => {
  test('calls console.log for info level', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation();
    const transport = createBrowserTransport();
    transport.log('info', 'test message');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toContain('🍌 INFO');
    expect(spy.mock.calls[0][0]).toContain('test message');
    spy.mockRestore();
  });

  test('calls console.error for error level', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation();
    const transport = createBrowserTransport();
    transport.log('error', 'bad thing');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toContain('🚨 ERROR');
    spy.mockRestore();
  });

  test('calls console.warn for warn level', () => {
    const spy = jest.spyOn(console, 'warn').mockImplementation();
    const transport = createBrowserTransport();
    transport.log('warn', 'caution');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toContain('⚠️  WARN');
    spy.mockRestore();
  });

  test('calls console.debug for debug level', () => {
    const spy = jest.spyOn(console, 'debug').mockImplementation();
    const transport = createBrowserTransport();
    transport.log('debug', 'verbose');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toContain('🐒 DEBUG');
    spy.mockRestore();
  });

  test('passes structured data as second argument', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation();
    const transport = createBrowserTransport();
    transport.log('info', 'with data', { userId: 42 });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][1]).toEqual({ userId: 42 });
    spy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// Banana Logger — Core
// ---------------------------------------------------------------------------

describe('Banana', () => {
  let banana: Banana;
  let transport: ReturnType<typeof spyTransport>;

  beforeEach(() => {
    Banana.resetInstance();
    banana = Banana.create({ level: 'debug' });
    transport = spyTransport();
    injectTransport(banana, transport);
  });

  // ---- Basic logging ----

  describe('basic logging', () => {
    test('debug emits at debug level', () => {
      banana.debug('d');
      expect(transport.calls).toHaveLength(1);
      expect(transport.calls[0].level).toBe('debug');
      expect(transport.calls[0].message).toContain('d');
    });

    test('info emits at info level', () => {
      banana.info('i');
      expect(transport.calls[0].level).toBe('info');
    });

    test('log is an alias for info', () => {
      banana.log('l');
      expect(transport.calls[0].level).toBe('info');
    });

    test('warn emits at warn level', () => {
      banana.warn('w');
      expect(transport.calls[0].level).toBe('warn');
    });

    test('error emits at error level', () => {
      banana.error('e');
      expect(transport.calls[0].level).toBe('error');
    });

    test('passes structured data through', () => {
      banana.info('msg', undefined, { key: 'value' });
      expect(transport.calls[0].data).toEqual({ key: 'value' });
    });
  });

  // ---- Level filtering ----

  describe('level filtering', () => {
    test('suppresses messages below configured level', () => {
      banana.configure({ level: 'warn' });
      banana.debug('no');
      banana.info('no');
      banana.warn('yes');
      banana.error('yes');
      expect(transport.calls).toHaveLength(2);
    });

    test('silent level suppresses everything', () => {
      banana.configure({ level: 'silent' });
      banana.error('nope');
      expect(transport.calls).toHaveLength(0);
    });
  });

  // ---- Configuration ----

  describe('configure', () => {
    test('sets global tag', () => {
      banana.configure({ tag: 'APP' });
      banana.info('msg');
      expect(transport.calls[0].message).toContain('[APP]');
    });

    test('sets global details', () => {
      banana.configure({ details: 'v2.0' });
      banana.info('msg');
      expect(transport.calls[0].message).toContain('[v2.0]');
    });

    test('sets global metadata', () => {
      banana.configure({ metadata: 'ctx' });
      banana.info('msg');
      expect(transport.calls[0].message).toContain('[ctx]');
    });

    test('per-call tag overrides global', () => {
      banana.configure({ tag: 'GLOBAL' });
      banana.info('msg', { tag: 'LOCAL' });
      expect(transport.calls[0].message).toContain('[LOCAL]');
      expect(transport.calls[0].message).not.toContain('[GLOBAL]');
    });

    test('per-call details overrides global', () => {
      banana.configure({ details: 'GLOBAL' });
      banana.info('msg', { details: 'LOCAL' });
      expect(transport.calls[0].message).toContain('[LOCAL]');
      expect(transport.calls[0].message).not.toContain('[GLOBAL]');
    });

    test('per-call metadata overrides global', () => {
      banana.configure({ metadata: 'GLOBAL' });
      banana.info('msg', { metadata: 'LOCAL' });
      expect(transport.calls[0].message).toContain('[LOCAL]');
      expect(transport.calls[0].message).not.toContain('[GLOBAL]');
    });

    test('all global options combined', () => {
      banana.configure({ tag: 'T', details: 'D', metadata: 'M' });
      banana.info('msg');
      expect(transport.calls[0].message).toBe('[T] [D] [M] msg');
    });

    test('highlights are applied', () => {
      banana.configure({ highlights: [{ keyword: 'fail', style: '31' }] });
      banana.info('test fail case');
      expect(transport.calls[0].message).toContain('\x1b[31m');
    });
  });

  // ---- Reset ----

  describe('reset', () => {
    test('clears global tag, details, metadata, highlights', () => {
      banana.configure({ tag: 'X', details: 'Y', metadata: 'Z', highlights: [{ keyword: 'a', style: '1' }] });
      banana.reset();
      banana.info('clean');
      expect(transport.calls[0].message).toBe('clean');
    });

    test('clears active timers', () => {
      banana.time('timer1');
      banana.reset();
      banana.timeEnd('timer1');
      // Should produce a warning since timer was cleared.
      expect(transport.calls[0].message).toContain("does not exist");
    });

    test('clears group stack', () => {
      banana.groupStart('G');
      transport.calls.length = 0; // clear groupStart output
      banana.reset();
      banana.info('msg');
      // Should not have group prefix.
      expect(transport.calls[0].message).toBe('msg');
    });

    test('clears log callback', () => {
      const cb = jest.fn();
      banana.setLogCallback(cb);
      banana.reset();
      banana.info('msg');
      expect(cb).not.toHaveBeenCalled();
    });
  });

  // ---- Callbacks ----

  describe('log callback', () => {
    test('invokes callback on each log', () => {
      const cb = jest.fn();
      banana.setLogCallback(cb);
      banana.info('hello');
      expect(cb).toHaveBeenCalledTimes(1);
      expect(cb.mock.calls[0][0]).toBe('info');
      expect(cb.mock.calls[0][1]).toContain('hello');
    });

    test('passes options to callback', () => {
      const cb = jest.fn();
      banana.setLogCallback(cb);
      const opts: LogOptions = { tag: 'T' };
      banana.warn('w', opts);
      expect(cb.mock.calls[0][2]).toBe(opts);
    });

    test('can be cleared with null', () => {
      const cb = jest.fn();
      banana.setLogCallback(cb);
      banana.setLogCallback(null);
      banana.info('hi');
      expect(cb).not.toHaveBeenCalled();
    });
  });

  // ---- Timing ----

  describe('timing', () => {
    test('time + timeEnd logs duration', () => {
      banana.time('op');
      banana.timeEnd('op');
      expect(transport.calls).toHaveLength(1);
      expect(transport.calls[0].message).toMatch(/op: \d+\.\d+ms/);
    });

    test('timeEnd warns when timer does not exist', () => {
      banana.timeEnd('missing');
      expect(transport.calls[0].level).toBe('warn');
      expect(transport.calls[0].message).toContain("'missing'");
    });

    test('timePromise with async function', async () => {
      const result = await banana.timePromise('fn', async () => 'done');
      expect(result).toBe('done');
      expect(transport.calls[0].message).toMatch(/fn: \d+\.\d+ms/);
    });

    test('timePromise with promise directly', async () => {
      const result = await banana.timePromise('p', Promise.resolve(42));
      expect(result).toBe(42);
      expect(transport.calls[0].message).toMatch(/p: \d+\.\d+ms/);
    });

    test('timePromise re-throws errors and still logs timing', async () => {
      const failing = async () => {
        throw new Error('boom');
      };
      await expect(banana.timePromise('err', failing)).rejects.toThrow('boom');
      expect(transport.calls[0].message).toMatch(/err: \d+\.\d+ms/);
    });
  });

  // ---- Grouping ----

  describe('grouping', () => {
    test('groupStart + groupEnd emit headers', () => {
      banana.groupStart('G1');
      banana.groupEnd();
      const messages = transport.calls.map(c => c.message);
      expect(messages.some(m => m.includes('START: G1'))).toBe(true);
      expect(messages.some(m => m.includes('END: G1'))).toBe(true);
    });

    test('nested groups add group prefix to messages', () => {
      banana.groupStart('Outer');
      banana.groupStart('Inner');
      banana.info('deep message');
      banana.groupEnd();
      banana.groupEnd();
      const infoCall = transport.calls.find(c => c.message.includes('deep message'));
      expect(infoCall?.message).toContain('Outer > Inner');
    });

    test('groupEnd with empty stack warns', () => {
      banana.groupEnd();
      expect(transport.calls[0].level).toBe('warn');
      expect(transport.calls[0].message).toContain('no active group');
    });
  });

  // ---- Tab ----

  describe('tab', () => {
    test('calls console.table with array data', () => {
      const spy = jest.spyOn(console, 'table').mockImplementation();
      const data = [{ a: 1 }, { a: 2 }];
      banana.tab(data);
      expect(spy).toHaveBeenCalledWith(data);
      spy.mockRestore();
    });

    test('calls console.table with object data', () => {
      const spy = jest.spyOn(console, 'table').mockImplementation();
      const data = { x: 1, y: 2 };
      banana.tab(data);
      expect(spy).toHaveBeenCalledWith(data);
      spy.mockRestore();
    });

    test('handles empty array', () => {
      const spy = jest.spyOn(console, 'table').mockImplementation();
      banana.tab([]);
      expect(spy).toHaveBeenCalledWith([]);
      spy.mockRestore();
    });

    test('rejects non-object data', () => {
      // @ts-expect-error Testing invalid input type
      banana.tab('string');
      expect(transport.calls[0].message).toContain('not an array or object');
    });

    test('rejects null', () => {
      // @ts-expect-error Testing null input
      banana.tab(null);
      expect(transport.calls[0].message).toContain('not an array or object');
    });
  });

  // ---- addBlankLine ----

  describe('addBlankLine', () => {
    test('emits an empty info line', () => {
      banana.addBlankLine();
      expect(transport.calls).toHaveLength(1);
      expect(transport.calls[0].message).toBe('');
      expect(transport.calls[0].level).toBe('info');
    });
  });

  // ---- Child loggers ----

  describe('child', () => {
    test('creates a child with a fixed tag', () => {
      const child = banana.child('DB');
      injectTransport(child, transport);
      child.info('connected');
      expect(transport.calls[0].message).toContain('[DB]');
    });

    test('child inherits parent level', () => {
      banana.configure({ level: 'error' });
      const child = banana.child('CHILD');
      injectTransport(child, transport);
      child.info('ignored');
      child.error('shown');
      expect(transport.calls).toHaveLength(1);
      expect(transport.calls[0].level).toBe('error');
    });

    test('child inherits parent callback', () => {
      const cb = jest.fn();
      banana.setLogCallback(cb);
      const child = banana.child('CHILD');
      injectTransport(child, transport);
      child.info('msg');
      expect(cb).toHaveBeenCalledTimes(1);
    });
  });

  // ---- Singleton ----

  describe('singleton', () => {
    test('getInstance returns the same instance', () => {
      const a = Banana.getInstance();
      const b = Banana.getInstance();
      expect(a).toBe(b);
    });

    test('resetInstance creates a fresh singleton', () => {
      const a = Banana.getInstance();
      Banana.resetInstance();
      const b = Banana.getInstance();
      expect(a).not.toBe(b);
    });
  });

  // ---- Error resilience ----

  describe('error resilience', () => {
    test('does not throw when transport.log throws', () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      const badTransport: Transport = {
        log() { throw new Error('transport failed'); },
      };
      injectTransport(banana, badTransport);
      expect(() => banana.info('should not throw')).not.toThrow();
      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });
  });

  // ---- Flush ----

  describe('flush', () => {
    test('calls transport.flush when available', () => {
      const flushFn = jest.fn();
      transport.flush = flushFn;
      banana.flush();
      expect(flushFn).toHaveBeenCalledTimes(1);
    });

    test('does not throw when transport has no flush', () => {
      delete (transport as Partial<Transport>).flush;
      expect(() => banana.flush()).not.toThrow();
    });
  });
});
