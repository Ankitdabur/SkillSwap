import asyncHandler from "../../utils/asyncHandler.js"
import ApiResponse from "../../utils/ApiResponse.js";
import { registerUserService , loginUserService } from "./auth.service.js";
import {cookieOptions} from "../../utils/cookieOptions.js"


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

export {registerUser , loginUser}
