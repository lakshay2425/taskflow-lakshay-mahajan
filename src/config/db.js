import knex from 'knex';
import knexConfig from '../../knexfile.js';


export const db = knex(knexConfig.development);
db.raw('SELECT 1')
  .then(() => console.log('DB connected'))
  .catch((err) => console.error('DB connection failed:', err.message));

// Run inside any transaction that needs a lock
// Prevents queries from waiting indefinitely if a lock can't be acquired
export const withLockTimeout = async (trx, ms = 5000) => {
  await trx.raw(`SET LOCAL lock_timeout = '${ms}ms'`);
};
