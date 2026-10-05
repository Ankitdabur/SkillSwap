import asyncHandler from "../../utils/asyncHandler.js";
import User from "../../models/user.model.js";
import Skill from "../../models/skill.model.js"
import uploadOnCloudinary from "../../utils/cloudinary.js"
import ApiError from "../../utils/ApiError.js";
import { ERROR_CODES } from "../../constants/errorCodes.js";
import { ACCOUNT_TYPES } from "../../constants/enums.js";


const registerUserService = async (userData , avatarLocalPath) => {

    const {
    fullname,
    username,
    email,
    password,
    accountType,
    languages,
    teachingSkills,
    teachingStyles,
  } = userData;

    // check if email already exists

    const existedEmail = await User.findOne({email})

     if (existedEmail) {
        throw new ApiError(
         409,
         "User with this email already exists",
         ERROR_CODES.EMAIL_ALREADY_EXISTS,
       );
    }

   // check if username already exists

    const existedUsername = await User.findOne({ username });

  if (existedUsername) {
    throw new ApiError(
      409,
      "Username already exists",
      ERROR_CODES.USERNAME_ALREADY_EXISTS,
    );
  }

  // check account type
  
  const isTeachingAccount =
    accountType === ACCOUNT_TYPES.TEACHER ||
    accountType === ACCOUNT_TYPES.TEACHER_LEARNER;

    // verify teaching skills actually exist in database
    if(isTeachingAccount){

        const existingSkillsCount = await Skill.countDocuments( {
            _id : {
                $in : teachingSkills,
            }
        } )

        if(existingSkillsCount !== teachingSkills.length ){
            throw new ApiError(
                400,
                "One or more selected teaching skills do not exist",
                ERROR_CODES.INVALID_FIELD_VALUE,
            );
        }    
    }

    // upload avatar if provided
    
    let avatar;
    let avatarUrl;
    if(avatarLocalPath){
        avatar = await uploadOnCloudinary(avatarLocalPath)
        if (!avatar) {
           throw new ApiError(
                 500,
                 "Avatar upload failed",
                 ERROR_CODES.INTERNAL_SERVER_ERROR,
            );
        }

        avatarUrl = avatar.url || avatar.secure_url    
    } 

    // prepare user data

    const userToCreate = {
         fullname,
         email,
         username,
         password,
         accountType,
         languages,
         avatar : avatarUrl,
         teachingSkills,
         teachingStyles
    };

  // create user

  let user;

  try {
    user = await User.create(userToCreate);
  } catch (error) {

    // database unique index is the final duplicate protection

    if (error?.code === 11000) {
      if (error?.keyPattern?.email) {
        throw new ApiError(
          409,
          "User with this email already exists",
          ERROR_CODES.EMAIL_ALREADY_EXISTS,
        );
      }

      if (error?.keyPattern?.username) {
        throw new ApiError(
          409,
          "Username already exists",
          ERROR_CODES.USERNAME_ALREADY_EXISTS,
        );
      }
    }

    throw error;
  }


  // get safe user data

  const createdUser = await User.findById(user._id).select(
    "-password -refreshTokenHash",
  );

  if (!createdUser) {
    throw new ApiError(
      500,
      "Something went wrong while registering the user",
      ERROR_CODES.INTERNAL_SERVER_ERROR,
    );
  }

  return createdUser;
};

export { registerUserService };

