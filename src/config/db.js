import knex from 'knex';
import knexConfig from '../../knexfile.js';

// Use development config as default
const db = knex(knexConfig.development);

export default db;
