import asyncHandler from "../utils/asyncHandler.js"
import ApiError from "../utils/ApiError.js"
import { ERROR_CODES } from "../constants/errorCodes.js"
import { verifyAccessToken } from "../utils/token.js"
import User from "../models/user.model.js"

const verifyJWT = asyncHandler ( async(req , res , next) => {
   const accesstoken = req.header("Authorization")?.replace("Bearer ","")
   
   if(!accesstoken){
     throw new ApiError(401,"unauthorized request" ,ERROR_CODES.AUTHENTICATION_REQUIRED)
   }

   const decodedToken = verifyAccessToken(accesstoken)
   const user = await User.findById(decodedToken?._id)

   if(!user){
    throw new ApiError(401 ,"invalid access token" ,ERROR_CODES.INVALID_ACCESS_TOKEN)
   }

   req.user = user;
   next();
})

export {verifyJWT}