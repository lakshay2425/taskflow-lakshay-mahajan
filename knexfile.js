import { config } from "./src/config/config.js";

export default {
  development: {
    client: 'pg',                              
    connection: {
      connectionString: config.get("dbURI"),  
      ssl: false,
    },
    pool: { min: 2, max: 10 },
    migrations: {
      directory: './src/database/migrations'
    },
    seeds: {
      directory: './src/database/seeds'
    }
  }
};
