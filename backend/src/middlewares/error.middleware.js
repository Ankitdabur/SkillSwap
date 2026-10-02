import ApiError from "../utils/ApiError.js";
import { ERROR_CODES } from "../constants/errorCodes.js";

const errorHandler = (err , req , res , next) => {
  if(res.headersSent){
    return next(err)
  }

  const isApiError = err instanceof ApiError

  const statusCode = isApiError ? err.statusCode : 500
  const message = isApiError ? err.message : "Something went wrong on server"
  const code = isApiError ? err.code : ERROR_CODES.INTERNAL_SERVER_ERROR
  const errors = isApiError ? err.errors : []

  if (!isApiError){
    console.error(err)
  }

  return res.status(statusCode).json({
    statusCode,
    data : null,
    message,
    success : false,
    code,
    errors
  })

}

export {errorHandler}
