import createHttpError from 'http-errors';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const validateUUID = (...paramNames) => {
  return (req, res, next) => {
    for (const param of paramNames) {
      const value = req.params[param];
      if (value && !UUID_REGEX.test(value)) {
        return next(createHttpError(400, `Invalid ${param}: must be a valid UUID`));
      }
    }
    next();
  };
};
