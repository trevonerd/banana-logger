import banana from './dist/index';

// Global configuration
banana.configure({ tag: 'APP', details: 'v1.0.0' });

// Basic logging
// Output: 🍌 INFO [APP] [v1.0.0] Application started (log)
banana.log('Application started (log)');
// Output: 🍌 INFO [APP] [v1.0.0] Application started (info)
banana.info('Application started (info)');

// Logging with specific options
// Output: ⚠️ WARN [APP] [Low memory] [RAM: 80%] Warning!
banana.warn('Warning!', { details: 'Low memory', metadata: 'RAM: 80%' });

// Using timer
// Example 1: Measure the time of a synchronous function
banana.time('syncOperation');
// Perform some synchronous operation
for (let i = 0; i < 1000000; i++) {
  // Intensive operation
}
// Output: 🍌 INFO [APP] [v1.0.0] syncOperation: [time]ms
banana.timeEnd('syncOperation');

// Example 2: Measure the time of an asynchronous function
async function someAsyncOperation() {
  return new Promise(resolve => setTimeout(resolve, 1000));
}

banana.time('asyncOperation');
someAsyncOperation().then(() => {
  // Output: 🍌 INFO [APP] [v1.0.0] asyncOperation: [time]ms
  banana.timeEnd('asyncOperation');
});

// Example 3: Using timePromise with a function that returns a Promise
async function complexOperation() {
  await someAsyncOperation();
  return 'Operation completed';
}

banana.timePromise('complexOperation', complexOperation)
  .then(result => {
    // Output: 🍌 INFO [APP] [v1.0.0] complexOperation: [time]ms
    // Output: 🍌 INFO [APP] [v1.0.0] Result: Operation completed
    banana.info(`Result: ${result}`);
  });

// Example 4: Using timePromise with a Promise directly
banana.timePromise('directPromise', new Promise(resolve => setTimeout(() => resolve('Done'), 1500)))
  .then(result => {
    // Output: 🍌 INFO [APP] [v1.0.0] directPromise: [time]ms
    // Output: 🍌 INFO [APP] [v1.0.0] Result: Done
    banana.info(`Result: ${result}`);
  });

// Example 5: Handling errors with timePromise
async function operationWithError() {
  await someAsyncOperation();
  throw new Error('Something went wrong');
}

banana.timePromise('errorOperation', operationWithError)
  .catch(error => {
    // Output: 🚨 ERROR [APP] [v1.0.0] Error occurred: Something went wrong
    banana.error(`Error occurred: ${error.message}`);
  });

// Setting a log callback
// Output: 🍌 INFO [APP] [v1.0.0] Logging with callback
banana.setLogCallback((level, message, options) => {
  // Example: send log to an external service
 // console.dir({ level, message, ...options });
});
banana.info('Logging with callback');

// Using group
// Output: ----- START: User Authentication ------------------------------
// Output: 🍌 INFO [APP] [v1.0.0] User attempting to log in
// Output: ⚠️ WARN [APP] [v1.0.0] Invalid password attempt
// Output: 🍌 INFO [APP] [v1.0.0] User successfully authenticated
// Output: ----- END: User Authentication --------------------------------
banana.groupStart('User Authentication');
banana.info('User attempting to log in');
banana.warn('Invalid password attempt');
banana.info('User successfully authenticated');
banana.groupEnd();

// Output: ----- START: Data Processing ------------------------------
// Output: 🍌 INFO [APP] [v1.0.0] Starting data import
// Output: ----- START: File Processing ------------------------------
// Output: 🍌 INFO [APP] [v1.0.0] Processing file 1
// Output: 🍌 INFO [APP] [v1.0.0] Processing file 2
// Output: 🚨 ERROR [APP] [v1.0.0] Error processing file 3
// Output: ----- END: File Processing --------------------------------
// Output: 🍌 INFO [APP] [v1.0.0] Data import completed
// Output: ----- END: Data Processing --------------------------------
banana.groupStart('Data Processing');
banana.info('Starting data import');
banana.groupStart('File Processing');
banana.info('Processing file 1');
banana.info('Processing file 2');
banana.error('Error processing file 3');
banana.groupEnd();
banana.info('Data import completed');
banana.groupEnd();

// // Tabular data logging
// // Output: (Tabular format of the data)
// banana.tab([
//   { name: 'Alice', age: 30 },
//   { name: 'Bob', age: 25 }
// ]);

// Add blank line
// Output: (A blank line followed by the log message)
banana.addBlankLine();
banana.info('This message is after a blank line');

// Highlighting keywords
// Output: 🍌 INFO [APP] [v1.0.0] This is an error message that should be highlighted
// Output: ⚠️ WARN [APP] [v1.0.0] This is another error message that should be highlighted
banana.configure({ highlights: [{ keyword: 'error', style: '31' }] });
banana.info('This is an error message that should be highlighted');
banana.warn('This is another error message that should be highlighted');

// Configuring with global metadata
// Output: 🍌 INFO [APP] [v1.0.0] [https://example.com] This log entry includes clickable metadata
// Output: ⚠️ WARN [APP] [v1.0.0] [https://example.com] This warning log entry includes clickable metadata
banana.configure({ metadata: 'https://www.marcotrevisani.com' });
banana.info('This log entry includes clickable metadata');
banana.warn('This warning log entry includes clickable metadata');

// Resetting global configurations
// Output: 🍌 INFO This log entry should not include any global configuration
banana.reset();
banana.info('This log entry should not include any global configuration');
