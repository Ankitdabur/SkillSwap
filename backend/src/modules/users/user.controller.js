import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import User from "../../models/user.model.js";
import { ERROR_CODES } from "../../constants/errorCodes.js";
import uploadOnCloudinary from "../../utils/cloudinary.js"
import { 
    upgradeAccountService,
    getUserProfileService,
    updateProfileService,
    updateTeachingProfileService,
    changePasswordService

} from "./user.service.js";



const getCurrentUser = asyncHandler (async (req , res) => {

   return res
   .status(200)
   .json( 
    new ApiResponse(
    200,
    req.user,
    "Current user information fetched successfully"
   ))
})

const upgradeAccount = asyncHandler(async (req, res) => {
  const upgradedUser = await upgradeAccountService(
    req.user._id,
    req.body,
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        upgradedUser,
        "Account upgraded successfully",
      ),
    );
});

const updateProfile = asyncHandler (async (req , res) => {
   
    const updateData = {...req.body} 

    if(req.file.path){
        const avatarLocalPath = req.file.path
        const avatar = await uploadOnCloudinary(avatarLocalPath)

        if(!avatar){
            throw new ApiError(
        500,
        "Failed to upload avatar",
        ERROR_CODES.INTERNAL_SERVER_ERROR,
      );
        }

        updateData.avatar = avatar.url
    }

    const updatedUser = await updateProfileService(req.user._id , updateData)

    res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updatedUser,
            "User profile updated successfully"
        )
    )
})

const getUserProfile = asyncHandler(async (req ,res) => {
    const {userId} = req.params
    const user = await getUserProfileService(userId)
    
    res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "user profile info fetched successfully"
        )
    )
    
})

const updateTeachingProfile = asyncHandler(async (req ,res) => {

    const updatedUser = await updateTeachingProfileService(req.body , req.user._id)
    
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updatedUser,
            "teaching field updated successfully"
        )
    )
})

const changePassword = asyncHandler ( async (req , res) => {

    await changePasswordService (req.user._id , req.body)

    return res
    .status(200)
    .json(
        new ApiResponse(
        200,
        null,
        "Password changed successfully",
        ),
    );
})






export {
  upgradeAccount,
  getUserProfile,
  updateProfile,
  getCurrentUser,
  updateTeachingProfile,
  changePassword
  
};


