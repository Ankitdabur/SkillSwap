import ApiError from "../utils/ApiError.js"
import { ERROR_CODES } from "../constants/errorCodes.js"

const requireAccountTypes = (...allowedAccountType) => {
    return (req , res , next) => {
        if (!req.user){
            throw new ApiError(
                401, 
                "Authentication required",
                ERROR_CODES.AUTHENTICATION_REQUIRED,
            )
        }

        if(!allowedAccountType.includes(req.user.accountType)){
            throw new ApiError(
                403,
                "you are not allowed to perform this action",
                ERROR_CODES.ACCOUNT_TYPE_NOT_PERMITTED,
            )
        }

        next()
    }
}

export {requireAccountType}