import jwt from "jsonwebtoken";
import bcrypt from "bcrypt"
import ApiError from "./ApiError.js";
import { ERROR_CODES } from "../constants/errorCodes.js";

export const generateAccessToken =  (userId) => {
     return jwt.sign(
        {
            _id : userId
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn : process.env.ACCESS_TOKEN_EXPIRY
        }
     );
}

export const generateRefreshToken = (userId) => {
    return jwt.sign(
        {
            _id : userId
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn : process.env.REFRESH_TOKEN_EXPIRY
        }
    );
}

export const verifyAccessToken = (token) => {
    try{
    return jwt.verify(token , process.env.ACCESS_TOKEN_SECRET)
    }
    catch(error){
        if(error.name ==="TokenExpiredError"){
            throw new ApiError (401 , "Access token has expired" , ERROR_CODES.ACCESS_TOKEN_EXPIRED)
        }
        
            throw new ApiError(401 , "Invalid access token" , ERROR_CODES.INVALID_ACCESS_TOKEN)
        
    }
}

export const verifyRefreshToken =  (token) => {
   try{
    return jwt.verify(token , process.env.REFRESH_TOKEN_SECRET)
    }
    catch(error){
        if(error.name ==="TokenExpiredError"){
            throw new ApiError (401 , "Refresh token has expired" , ERROR_CODES.REFRESH_TOKEN_EXPIRED)
        }
        
            throw new ApiError(401 , "Invalid refresh token" , ERROR_CODES.INVALID_REFRESH_TOKEN)
        
    }
}

export const hashRefreshToken = async (token) => {
  return await bcrypt.hash(token, 10);
};

export const compareRefreshToken = async (token, hashedToken) => {
  return await bcrypt.compare(token, hashedToken);
};