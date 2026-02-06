# Banana Logger 🍌

<p align="center">
  <img src="./banana-logo.webp" alt="Banana Logger" width="300"/>
</p>

A hybrid client/server TypeScript logger that adds banana emojis to your logs and happiness to your day.

Works everywhere — Node.js, Bun, Deno, Cloudflare Workers, and the browser — with zero configuration.

## Features

- **Hybrid** — Auto-detects server (pino) vs. browser (console) and picks the right transport
- **Fast** — Level checks happen *before* message formatting; disabled levels cost near-zero
- **Typed** — Full TypeScript with strict types and exported interfaces
- **Formatted** — Tags, details, metadata (clickable URLs), and ANSI keyword highlights
- **Structured Data** — Attach `Record<string, unknown>` to any log entry for JSON transports
- **Child Loggers** — `banana.child('DB')` gives you a scoped logger that inherits config
- **Timers** — `time()` / `timeEnd()` / `timePromise()` for built-in performance measurement
- **Groups** — Nested `groupStart()` / `groupEnd()` for visual log hierarchy
- **Callbacks** — Ship every log to Sentry, Datadog, or your own telemetry with `setLogCallback()`
- **Tabular Data** — `tab()` renders arrays/objects via `console.table`
- **Environment-Aware** — Log level auto-adjusts based on `NODE_ENV`

## Installation

```bash
npm install banana-logger
# or
bun add banana-logger
```

## Quick Start

```typescript
import banana from 'banana-logger';

banana.info('Hello world!');
// 🍌 INFO [2026-02-06 12:00:00.000] Hello world!
```

## Configuration

```typescript
import banana from 'banana-logger';

banana.configure({
  tag: 'APP',
  details: 'v2.0.0',
  level: 'info',           // 'debug' | 'info' | 'warn' | 'error' | 'silent'
  metadata: 'https://example.com',
  highlights: [{ keyword: 'error', style: '31' }],  // ANSI red
  transport: 'server',     // force 'server' | 'browser' (auto-detected by default)
  json: false,             // true = raw JSON lines (server only)
});
```

## Logging Levels

| Level     | Emoji | When to use                             |
|-----------|-------|-----------------------------------------|
| `debug`   | 🐒    | Verbose development output              |
| `info`    | 🍌    | Normal operational messages              |
| `warn`    | ⚠️     | Something unexpected but recoverable    |
| `error`   | 🚨    | Something broke                         |
| `silent`  | —     | Suppress all output                     |

Auto-detected from `NODE_ENV`:
- `production` → `error`
- `staging` → `warn`
- anything else → `debug`

## Per-Call Options

```typescript
banana.warn('Disk full', {
  tag: 'DISK',
  details: '/dev/sda1',
  metadata: 'https://status.example.com',
});
// ⚠️ WARN [DISK] [/dev/sda1] (https://status.example.com 🔗) Disk full
```

## Structured Data

```typescript
banana.info('Request handled', undefined, {
  method: 'GET',
  path: '/api/users',
  status: 200,
  durationMs: 12,
});
```

## Timers

```typescript
banana.time('db-query');
const rows = await db.query('SELECT ...');
banana.timeEnd('db-query');
// 🍌 INFO db-query: 42.17ms

// Or wrap a promise:
const users = await banana.timePromise('fetch-users', () => api.getUsers());
```

## Grouped Logs

```typescript
banana.groupStart('Authentication');
banana.info('Checking credentials');
banana.warn('Rate limit approaching');
banana.groupEnd();
```

## Child Loggers

```typescript
const dbLog = banana.child('DB');
dbLog.info('Pool ready');         // 🍌 INFO [DB] Pool ready
dbLog.warn('Slow query', undefined, { query: 'SELECT *', ms: 3200 });
```

## Log Callbacks

```typescript
banana.setLogCallback((level, message, options) => {
  sentry.addBreadcrumb({ level, message });
});
```

## Independent Instances

```typescript
import { Banana } from 'banana-logger';

const workerLog = Banana.create({ tag: 'WORKER', level: 'warn' });
workerLog.warn('Retrying job #3');
```

## Tabular Data

```typescript
banana.tab([
  { name: 'Alice', age: 30 },
  { name: 'Bob', age: 25 },
]);
```

## API Reference

### Default Export

| Method | Description |
|--------|-------------|
| `debug(message, options?, data?)` | Log at debug level |
| `info(message, options?, data?)` | Log at info level |
| `log(message, options?, data?)` | Alias for `info` |
| `warn(message, options?, data?)` | Log at warn level |
| `error(message, options?, data?)` | Log at error level |
| `configure(config)` | Set global configuration |
| `reset()` | Clear all state (config, timers, groups, callbacks) |
| `setLogCallback(callback)` | Set or clear log callback |
| `time(label)` | Start a named timer |
| `timeEnd(label)` | End timer and log duration |
| `timePromise(label, fn)` | Measure async function/promise |
| `groupStart(label)` | Start a named log group |
| `groupEnd()` | End the current log group |
| `tab(data)` | Display data via `console.table` |
| `addBlankLine()` | Emit an empty line |
| `child(tag)` | Create a child logger with fixed tag |
| `flush()` | Flush buffered output |

### Named Exports

| Export | Description |
|--------|-------------|
| `Banana` | The class — use `Banana.create()` or `Banana.getInstance()` |
| `formatMessage()` | Pure formatting function |
| `applyHighlights()` | Apply ANSI highlights to a string |
| `isValidUrl()` | Check if a string is a valid HTTP(S) URL |
| `isLevelEnabled()` | Check if a level meets a threshold |
| `levelFromEnv()` | Infer log level from `NODE_ENV` |
| `LOG_LEVELS` | `['debug', 'info', 'warn', 'error']` |
| `createBrowserTransport()` | Create the console-based transport |

### Types

`BananaConfig`, `LogLevel`, `LogOptions`, `LogCallback`, `LogData`, `HighlightRule`, `Transport`

## Contributing

Contributions are welcome! Please submit a pull request or open an issue on GitHub.

## License

This project is licensed under the MIT License.

---

Made with ❤️ by [trevonerd](https://github.com/trevonerd) and a touch of 🍌.
