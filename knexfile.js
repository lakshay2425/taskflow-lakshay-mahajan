import {config} from "./src/config/config.js";

export default {
  development: {
    client: 'postgresql',
    connection: config.get("dbURI"), 
    migrations: {
      directory: './src/database/migrations'
    },
    seeds: {
      directory: './src/database/seeds'
    }
  }
};
