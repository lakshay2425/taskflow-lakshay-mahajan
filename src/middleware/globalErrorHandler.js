// import { logger } from '../utilis/logger.js'; // Your winston instance

export const globalErrorHandler = (err, req, res, next) => {
    // 1. Handle Zod Validation Errors
    if (err.name === 'ZodError' || err.status === 400) {
        const fields = {};
        if (err.issues) {
            err.issues.forEach((issue) => {
                fields[issue.path[0]] = issue.message;
            });
        }
        
        return res.status(400).json({
            error: "validation failed",
            fields: Object.keys(fields).length > 0 ? fields : { message: err.message }
        });
    }

    // // 2. Structured Logging (The "logrus/zap" requirement)
    // logger.error({
    //     message: err.message,
    //     stack: err.stack,
    //     path: req.path,
    //     method: req.method,
    //     requestId: req.headers['x-request-id']
    // });

    if (err.status === 404) {
        return res.status(404).json({ error: "not found" });
    }

    const status = err.status || 500;
    res.status(status).json({
        error: status === 500 ? "internal server error" : err.message
    });
};
