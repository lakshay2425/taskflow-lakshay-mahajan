import {config} from "../config/config.js"

export const globalErrorHandler = (err, _req, res, _next) => {
    const environment = config.get("NODE_ENVIRONMENT");
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
        message: err.message,
        errorStack: environment === "development" ? err.stack : "",
    })
}
