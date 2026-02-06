/**
 * Banana Logger — Usage Examples
 *
 * Run with: bun ./examples.ts
 */

import banana, { Banana } from './src/index';

// ---------------------------------------------------------------------------
// 1. Basic logging
// ---------------------------------------------------------------------------

banana.configure({ tag: 'APP', details: 'v1.0.0' });

banana.log('Application started (log)');
banana.info('Application started (info)');
banana.debug('Debug details for development');

// ---------------------------------------------------------------------------
// 2. Per-call overrides
// ---------------------------------------------------------------------------

banana.warn('Warning!', { details: 'Low memory', metadata: 'RAM: 80%' });
banana.error('Disk failure', { tag: 'DISK', metadata: 'https://status.example.com' });

// ---------------------------------------------------------------------------
// 3. Timers
// ---------------------------------------------------------------------------

// Synchronous timer
banana.time('syncOperation');
for (let i = 0; i < 1_000_000; i++) { /* burn some CPU */ }
banana.timeEnd('syncOperation');

// Async timer via timePromise
const result = await banana.timePromise('asyncFetch', async () => {
  await new Promise(resolve => setTimeout(resolve, 150));
  return { users: 42 };
});
banana.info(`Fetched ${result.users} users`);

// ---------------------------------------------------------------------------
// 4. Grouped logging
// ---------------------------------------------------------------------------

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
banana.groupEnd(); // File Processing
banana.info('Data import completed');
banana.groupEnd(); // Data Processing

// ---------------------------------------------------------------------------
// 5. Structured data
// ---------------------------------------------------------------------------

banana.info('Request handled', undefined, {
  method: 'GET',
  path: '/api/users',
  status: 200,
  durationMs: 12,
});

// ---------------------------------------------------------------------------
// 6. Tabular data
// ---------------------------------------------------------------------------

banana.tab([
  { name: 'Alice', age: 30, role: 'admin' },
  { name: 'Bob', age: 25, role: 'user' },
]);

// ---------------------------------------------------------------------------
// 7. Log callback (send to external service)
// ---------------------------------------------------------------------------

banana.setLogCallback((level, message) => {
  // In real code: sentry.addBreadcrumb({ level, message })
  // We just print a marker here to show it fires.
  process.stdout.write(`  [callback] ${level}: ${message}\n`);
});
banana.info('This triggers the callback');
banana.setLogCallback(null); // clear it

// ---------------------------------------------------------------------------
// 8. Keyword highlighting
// ---------------------------------------------------------------------------

banana.configure({ highlights: [{ keyword: 'error', style: '31' }] });
banana.info('This is an error message that should be highlighted');
banana.warn('Another error highlighted here too');

// ---------------------------------------------------------------------------
// 9. Clickable metadata (URLs)
// ---------------------------------------------------------------------------

banana.configure({ metadata: 'https://www.marcotrevisani.com' });
banana.info('Visit the author homepage');

// ---------------------------------------------------------------------------
// 10. Child loggers
// ---------------------------------------------------------------------------

const dbLog = banana.child('DB');
dbLog.info('Connection pool initialised (5 connections)');
dbLog.warn('Slow query detected', undefined, { query: 'SELECT *', durationMs: 3200 });

// ---------------------------------------------------------------------------
// 11. Reset & clean state
// ---------------------------------------------------------------------------

banana.reset();
banana.info('Clean slate — no tags, no metadata, nothing');

// ---------------------------------------------------------------------------
// 12. Independent instance via Banana.create
// ---------------------------------------------------------------------------

const workerLog = Banana.create({ tag: 'WORKER', level: 'warn' });
workerLog.debug('This will NOT appear (below warn level)');
workerLog.warn('Job retry #3');
workerLog.error('Job failed permanently');

banana.addBlankLine();
banana.info('Examples complete!');
