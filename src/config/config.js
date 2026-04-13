const _config = {
    PORT: process.env.PORT,
    NODE_ENVIRONMENT: process.env.NODE_ENVIRONMENT,
    dbURI: process.env.DB_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    BYPASS_AUTH: process.env.BYPASS_AUTH,
    TEST_USER_EMAIL: process.env.TEST_USER_EMAIL,
    FRONTEND_URL: process.env.FRONTEND_URL,
    BCRYPT_SALT_ROUNDS: process.env.BCRYPT_SALT_ROUNDS
}


export const config = {
    get(key) {  
        const value = _config[key];
        if (value === undefined || value === null) {
            console.error(`Config key "${key}" not found.`);
            process.exit(1);
        }
        return value;
    }
}
