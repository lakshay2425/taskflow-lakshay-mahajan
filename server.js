import app from './app.js';
import {config} from './src/config/config.js';

const startServer = () => {
    const port = config.get("PORT");
    const server = app.listen(port, () => {
        console.log(`🚀 Server is running on port ${port}`);
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`Port ${port} is already in use. Clean up your processes!`);
            process.exit(1);
        }
        console.error("Server failed to start:", err);
    });
}

startServer();
