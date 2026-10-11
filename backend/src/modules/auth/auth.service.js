import asyncHandler from "../../utils/asyncHandler.js";
import User from "../../models/user.model.js";
import Skill from "../../models/skill.model.js"
import uploadOnCloudinary from "../../utils/cloudinary.js"
import ApiError from "../../utils/ApiError.js";
import { ERROR_CODES } from "../../constants/errorCodes.js";
import { ACCOUNT_TYPES } from "../../constants/enums.js";
import {
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  verifyRefreshToken,
  compareRefreshToken
} from "../../utils/token.js";


// REGISTER 
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

  //unnecessary...beacuse in user model select => false
  //const createdUser = await User.findById(user._id).select(
  //  "-password -refreshTokenHash",
  //);

  const createdUser = await User.findById(user._id)

  if (!createdUser) {
    throw new ApiError(
      500,
      "Something went wrong while registering the user",
      ERROR_CODES.INTERNAL_SERVER_ERROR,
    );
  }

  return createdUser;
};


//LOGIN
const loginUserService = async (userData) => {
  
  const {
    identifier,
    password,
  } = userData;


  // find user using username or email

  const user = await User.findOne({
    $or: [
      { username: identifier },
      { email: identifier },
    ],
  }).select("+password");


  // user not found

  if (!user) {
    throw new ApiError(
      401,
      "Invalid credentials",
      ERROR_CODES.INVALID_CREDENTIALS,
    );
  }


  // check password

  const isPasswordCorrect = await user.isPasswordCorrect(password);

  if (!isPasswordCorrect) {
    throw new ApiError(
      401,
      "Invalid credentials",
      ERROR_CODES.INVALID_CREDENTIALS,
    );
  }


  // generate tokens

  const accessToken = generateAccessToken(user._id);

  const refreshToken = generateRefreshToken(user._id);


  // hash refresh token before storing in database

  const refreshTokenHash = await hashRefreshToken(refreshToken);


  // store refresh token hash

  const loggedInUser = await User.findByIdAndUpdate(
    user._id,
    {
      $set: {
        refreshTokenHash,
      },
    },
    {
        new : true
    }
  );

 

  if (!loggedInUser) {
    throw new ApiError(
      500,
      "Something went wrong while logging in",
      ERROR_CODES.INTERNAL_SERVER_ERROR,
    );
  }


  return {
    user: loggedInUser,
    accessToken,
    refreshToken,
  };

}

//REFRESH ACCESS TOKEN
const refreshUserService = async (incomingRefreshToken) => {

  const decodedToken =  verifyRefreshToken(incomingRefreshToken)

  const user = await User.findById(decodedToken?._id)
  .select("+refreshTokenHash");

  if (!user || !user.refreshTokenHash) {
    throw new ApiError(
      401,
      "Invalid refresh token",
      ERROR_CODES.INVALID_REFRESH_TOKEN,
    );
  }

  const isRefreshTokenValid = await compareRefreshToken(incomingRefreshToken , user.refreshTokenHash)

  if (!isRefreshTokenValid) {
    throw new ApiError(
      401,
      "Invalid refresh token",
      ERROR_CODES.INVALID_REFRESH_TOKEN,
    );
  }

  const accessToken = generateAccessToken(user._id);

  const refreshToken = generateRefreshToken(user._id);

  const refreshTokenHash = await hashRefreshToken(refreshToken);
  
  const updatedUser = await User.findByIdAndUpdate(
  user._id,
  {
    $set: { refreshTokenHash },
  },
  { new: true },
  );

  if (!updatedUser) {
    throw new ApiError(
      401,
      "Invalid refresh token",
      ERROR_CODES.INVALID_REFRESH_TOKEN,
    );
  }
   return {
    accessToken,
    refreshToken
   }
}

//LOGOUT USER
const logoutUserService = async (userId) => {
  
  await User.findByIdAndUpdate( userId,
    {
      $unset : {
        hashRefreshToken : 1
      },
    }
  )

  return
}


export { registerUserService , loginUserService , refreshUserService , logoutUserService};

