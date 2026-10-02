import { ERROR_CODES } from "../constants/errorCodes.js";

class ApiError extends Error {
  constructor(
    statusCode,
    message = "Something went wrong",
    code = ERROR_CODES.INTERNAL_SERVER_ERROR,
    errors = [],
    stack = "",
  ) {
    super(message);

    this.name = "ApiError";
    this.statusCode = statusCode;
    this.data = null;
    this.success = false;
    this.errors = errors;
    this.code = code;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default ApiError;