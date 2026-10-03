import ApiError from "../utils/ApiError.js"
import { ERROR_CODES } from "../constants/errorCodes.js"



const notFound = (req , res , next ) => {
 return next(
    new ApiError(
        404,
        "Route not found",
        ERROR_CODES.RESOURCE_NOT_FOUND
    )
 )
}

export {notFound}

//throw new ApiError also works
//new concept next(something) => goes to err handler

