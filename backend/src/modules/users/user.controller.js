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

   const currentUserData = {
    user: req.user
   }

   return res
   .status(200)
   .json( 
    new ApiResponse(
    200,
    currentUserData,
    "Current user information fetched successfully"
   ))
})

const upgradeAccount = asyncHandler(async (req, res) => {
  const upgradedUserData = await upgradeAccountService(
    req.user._id,
    req.body,
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        upgradedUserData,
        "Account upgraded successfully",
      ),
    );
});

const updateProfile = asyncHandler (async (req , res) => {
   
    const updateData = {...req.body} 

    if(req.file?.path){
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

    const updatedUserData = await updateProfileService(req.user._id , updateData)

    res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updatedUserData,
            "User profile updated successfully"
        )
    )
})

const getUserProfile = asyncHandler(async (req ,res) => {
    const {userId} = req.params
    const userData = await getUserProfileService(userId)
    
    res
    .status(200)
    .json(
        new ApiResponse(
            200,
            userData,
            "user profile info fetched successfully"
        )
    )
    
})

const updateTeachingProfile = asyncHandler(async (req ,res) => {

    const updatedUserData = await updateTeachingProfileService(req.body , req.user._id)
    
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updatedUserData,
            "teaching field updated successfully"
        )
    )
})

const changePassword = asyncHandler ( async (req , res) => {

    const passwordData = await changePasswordService (req.user._id , req.body)

    return res
    .status(200)
    .json(
        new ApiResponse(
        200,
        passwordData,
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


