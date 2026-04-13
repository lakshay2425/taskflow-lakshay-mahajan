export const asyncHandler =  (fn) => {
    return ((req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    });
};

export const dbOperation = async (operation, errorMessage) => {
    try {
        return await operation();
    } catch (error) {
        console.error(`DB Error: ${errorMessage}`, error.message);
        if (error.code === '55P03') {
            throw createError('Resource is currently being modified, please retry', 409);
        }
        if (error.code === '23505') {
            throw createError('Resource already exists', 409);
        }
        if (error.code === '23503') {
            throw createError('Referenced resource does not exist', 400);
        }
        throw createError(errorMessage, 500);
    }
};

//Custom Error with statusCode (works with your global handler)
export const createError = (message, statusCode = 500) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

//External service wrapper
export const serviceOperation = async (operation, errorMessage) => {
    try {
        return await operation();
    } catch (error) {
        console.error(`Service Error: ${errorMessage}`, error.message);
        throw createError(errorMessage, 500);
    }
};
