import asyncHandler from "../../utils/asyncHandler.js"
import ApiResponse from "../../utils/ApiResponse.js";
import {cookieOptions} from "../../utils/cookieOptions.js"
import ApiError from "../../utils/ApiError.js";
import { ERROR_CODES } from "../../constants/errorCodes.js";
import { 
  registerUserService , 
  loginUserService ,
  refreshUserService,
  logoutUserService} from "./auth.service.js";

const registerUser = asyncHandler( async (req , res) => {

 const avatarLocalPath = req.file?.path;

  const registeredUser = await registerUserService(
    req.body,
    avatarLocalPath,
  );

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        registeredUser,
        "User registered successfully",
      ),
    );


})

const loginUser = asyncHandler (async (req , res) => {

const {
  user,
  accessToken,
  refreshToken,
} = await loginUserService(req.body);

return res
  .status(200)
  .cookie(
    "refreshToken",
    refreshToken,
    cookieOptions,
  )
  .json(
    new ApiResponse(
      200,
      {
        user,
        accessToken,
      },
      "User logged in successfully",
    ),
  );

})

const refreshAccessToken = asyncHandler (async (req , res) => {
   

  const incomingRefreshToken = req.cookies?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(
      401,
      "Refresh token is required",
      ERROR_CODES.INVALID_REFRESH_TOKEN,
    );
  }

  const {
    accessToken,
    refreshToken,
  } = await refreshUserService(incomingRefreshToken);

  

  return res
    .status(200)
    .cookie(
      "refreshToken",
      refreshToken,
      cookieOptions,
    )
    .json(
      new ApiResponse(
        200,
        {
          accessToken,
        },
        "Access token refreshed successfully",
      ),
    );
});

const logoutUser = asyncHandler (async (req , res) => {

 await logoutUserService(req.user._id)

  return res
  .status(200)
  .clearCookie("refreshToken" , cookieOptions)
  .json(new ApiResponse(
    200,
    {},
    "user logout successfully"
  ))


})

const getCurrentUser = asyncHandler (async (req , res) => {

   return res
   .status(201)
   .json( 
    new ApiResponse(
    200,
    req.user,
    "Current user information fetched successfully"
   ))
})
  




export {
  registerUser , 
  loginUser ,
  refreshAccessToken , 
  logoutUser , 
  getCurrentUser}
