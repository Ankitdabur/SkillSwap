import asyncHandler from "../../utils/asyncHandler.js"
import ApiResponse from "../../utils/ApiResponse.js";
import { registerUserService } from "./auth.service.js";

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

export {registerUser}
