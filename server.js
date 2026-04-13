import app from './app.js';
import { config } from './src/config/config.js';
import { db } from './src/config/db.js';          

const startServer = () => {
    const port = config.get("PORT");
    const server = app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`Port ${port} is already in use. Clean up your processes!`);
            process.exit(1);
        }
        console.error("Server failed to start:", err);
    });
    return server;                                  
}

const server = startServer();                       

process.on('SIGTERM', async () => {
    server.close(async () => {                      
        await db.destroy();                         
        process.exit(0);
    });
});
