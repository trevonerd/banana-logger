# Banana (Logger) 🍌

<p align="center">
  <img src="./banana-logo.webp" alt="Banana Logger" width="300"/>
</p>

Banana (Logger) is a fun and advanced TypeScript logger with formatting, callback, and timing capabilities. Inspired by the simplicity of logging but with a twist of humor, Banana Logger ensures your logging experience is both efficient and enjoyable.

## Features
- **Formatted Logging**: Customizable log messages with tags, details, and metadata.
- **Callbacks**: Define custom log handlers to extend functionality.
- **Timing**: Measure and log the duration of operations.
- **Group Logging**: Organize logs into groups for better readability.
- **Tabular Data Logging**: Easily log data in table format.

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

## API

### `configure(options: { tag?: string; details?: string; metadata?: string })`
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

## Contributing
Contributions are welcome! Please submit a pull request or open an issue on GitHub.

## License
This project is licensed under the MIT License.

---

Made with ❤️ by [TrevoNerd](https://github.com/trevonerd) and a touch of 🍌.