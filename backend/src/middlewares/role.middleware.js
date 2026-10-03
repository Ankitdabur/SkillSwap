import ApiError from "../utils/ApiError.js"
import { ERROR_CODES } from "../constants/errorCodes.js"

const requireRoles = (...allowedRoles) => {
    return (req , res , next ) => {
        if (!req.user){
            throw new ApiError(
                401, 
                "Authentication required",
                ERROR_CODES.AUTHENTICATION_REQUIRED,
            )
        }

        if(!allowedRoles.includes(req.user.role)){
            throw new ApiError(
                403,
                "You do not have permission to perform this action",
                ERROR_CODES.INSUFFICIENT_ROLE
            )
        }

        next()
    }
}

export {requireRoles}