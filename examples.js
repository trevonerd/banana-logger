import banana from './dist/esm/index.js';

// Global configuration
banana.configure({ tag: 'APP', details: 'v1.0.0' });

// Basic logging
banana.log('Application started (log)');
banana.info('Application started (info)');

// Logging with specific options
banana.warn('Warning!', { details: 'Low memory', metadata: 'RAM: 80%' });

// Using timer

// Esempio 1: Misurare il tempo di una funzione sincrona
banana.time('syncOperation');
// Esegui qualche operazione sincrona
for (let i = 0; i < 1000000; i++) {
  // Operazione intensa
}
banana.timeEnd('syncOperation');

// Esempio 2: Misurare il tempo di una funzione asincrona
async function someAsyncOperation() {
  return new Promise(resolve => setTimeout(resolve, 1000));
}

banana.time('asyncOperation');
someAsyncOperation().then(() => {
  banana.timeEnd('asyncOperation');
});

// Esempio 3: Utilizzare timePromise con una funzione che restituisce una Promise
async function complexOperation() {
  await someAsyncOperation();
  return 'Operation completed';
}

banana.timePromise('complexOperation', complexOperation)
  .then(result => {
    banana.info(`Result: ${result}`);
  });

// Esempio 4: Utilizzare timePromise con una Promise direttamente
banana.timePromise('directPromise', new Promise(resolve => setTimeout(() => resolve('Done'), 1500)))
  .then(result => {
    banana.info(`Result: ${result}`);
  });

// Esempio 5: Gestione degli errori con timePromise
async function operationWithError() {
  await someAsyncOperation();
  throw new Error('Something went wrong');
}

banana.timePromise('errorOperation', operationWithError)
  .catch(error => {
    banana.error(`Error occurred: ${error.message}`);
  });

// Setting a log callback
// banana.setLogCallback((level, message, options) => {
//   // Example: send log to an external service
//   console.dir({ level, message, ...options });
// });

// Using group
banana.groupStart('User Authentication');
banana.info('User attempting to log in');
banana.warn('Invalid password attempt');
banana.info('User successfully authenticated');
banana.groupEnd();

banana.groupStart('Data Processing');
banana.info('Starting data import');
banana.groupStart('File Processing');
banana.info('Processing file 1');
banana.info('Processing file 2');
banana.error('Error processing file 3');
banana.groupEnd();
banana.info('Data import completed');
banana.groupEnd();