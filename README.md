# Banana (Logger) 🍌

<p align="center">
  <img src="./banana-logo.webp" alt="Banana Logger" width="300"/>
</p>

Banana (Logger) is a fun and advanced TypeScript logger with formatting, callback, timing, and highlighting capabilities. Inspired by the simplicity of logging but with a twist of humor, Banana Logger ensures your logging experience is both efficient and enjoyable.

## Features
- **Formatted Logging**: Customizable log messages with tags, details, metadata, and highlights.
- **Callbacks**: Define custom log handlers to extend functionality.
- **Timing**: Measure and log the duration of operations.
- **Group Logging**: Organize logs into groups for better readability.
- **Tabular Data Logging**: Easily log data in table format.
- **Highlighting Keywords**: Highlight specific keywords in log messages for better visibility.
- **Environment-Specific Logging**: Automatically adjust logging levels based on environment (development, staging, production).

## Installation

```bash
npm install banana-logger
```

## Usage

### Basic Configuration

```typescript
import Banana from 'banana-logger';

// Basic configuration
Banana.configure({ tag: 'APP' });

// Simple logging
Banana.info('Application started');
```

### Logging with Options

```typescript
Banana.warn('Warning!', { details: 'Low memory', metadata: 'RAM: 80%' });
```

### Using Timer

```typescript
Banana.time('operation');
// ... perform operation ...
Banana.timeEnd('operation');
```

### Using Callback

```typescript
Banana.setLogCallback((level, message, options) => {
    // Send log to external service
});
```

### Grouped Logs

```typescript
Banana.groupStart('Initialization');
Banana.debug('Loading modules...');
Banana.groupEnd();
```

### Tabular Data Logging

```typescript
Banana.tab([{ name: 'Alice', age: 30 }, { name: 'Bob', age: 25 }]);
```

### Adding Blank Lines

```typescript
Banana.addBlankLine();
Banana.info('This message is after a blank line');
```

### Highlighting Keywords

```typescript
Banana.configure({ highlights: [{ keyword: 'error', style: '31' }] });
Banana.info('This is an error message that should be highlighted');
```

### Configuring with Global Metadata

```typescript
Banana.configure({ metadata: 'https://example.com' });
Banana.info('This log entry includes clickable metadata');
```

### Resetting Global Configurations

```typescript
Banana.reset();
Banana.info('This log entry should not include any global configuration');
```

## API

### `configure(options: { tag?: string; details?: string; metadata?: string; highlights?: HighlightConfig[] })`
Configure global options for all logs.

### `setLogCallback(callback: (level: LogLevel, message: string, options?: LogOptions) => void)`
Set a callback function for all log messages.

### `debug(message: string, options?: LogOptions)`
Log a debug message.

### `info(message: string, options?: LogOptions)`
Log an info message.

### `warn(message: string, options?: LogOptions)`
Log a warning message.

### `error(message: string, options?: LogOptions)`
Log an error message.

### `time(label: string)`
Start a timer with the specified label.

### `timeEnd(label: string)`
End a timer and log the elapsed time.

### `timePromise<T>(label: string, fn: (() => Promise<T>) | Promise<T>): Promise<T>`
Measure the execution time of a function or promise.

### `groupStart(label: string)`
Start a new log group.

### `groupEnd()`
End the current log group.

### `tab(data: Array<unknown> | object)`
Display data in a tabular format.

### `addBlankLine()`
Add a blank line to the logs.

### `applyHighlights(message: string, highlights: HighlightConfig[]): string`
Apply highlights to specific keywords in the log message.

### `isValidUrl(url: string): boolean`
Check if a given string is a valid URL.

### `reset()`
Reset global configurations to their default state.

## Contributing
Contributions are welcome! Please submit a pull request or open an issue on GitHub.

## License
This project is licensed under the MIT License.

---

Made with ❤️ by [trevonerd](https://github.com/trevonerd) and a touch of 🍌.
