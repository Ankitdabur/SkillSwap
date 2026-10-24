import User from "../../models/user.model.js";
import Skill from "../../models/skill.model.js";
import Availability from "../../models/availability.model.js";
import Match from "../../models/match.model.js";
import ApiError from "../../utils/ApiError.js";

import { ERROR_CODES } from "../../constants/errorCodes.js";
import {
  ACCOUNT_TYPES,
  MATCH_STATUSES,
} from "../../constants/enums.js";
import { TEACHING_STYLES } from "../../constants/enums.js";

const upgradeAccountService = async (userId, upgradeData) => {
  const {
    accountType,
    teachingSkills,
    teachingStyles,
  } = upgradeData;


  // 1. Find current user

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(
      404,
      "User not found",
      ERROR_CODES.USER_NOT_FOUND,
    );
  }


  // 2. Check whether requested upgrade is allowed

  const isLearnerUpgrade =
    user.accountType === ACCOUNT_TYPES.LEARNER &&
    (
      accountType === ACCOUNT_TYPES.TEACHER ||
      accountType === ACCOUNT_TYPES.TEACHER_LEARNER
    );

  const isTeacherUpgrade =
    user.accountType === ACCOUNT_TYPES.TEACHER &&
    accountType === ACCOUNT_TYPES.TEACHER_LEARNER;


  if (!isLearnerUpgrade && !isTeacherUpgrade) {
    throw new ApiError(
      400,
      "Invalid account upgrade",
      ERROR_CODES.INVALID_ACCOUNT_UPGRADE,
    );
  }


  // 3. Learner must provide teaching profile

  if (isLearnerUpgrade) {
    if (
      !teachingSkills ||
      !teachingStyles 
    ) {
      throw new ApiError(
        400,
        "Teaching skills and teaching styles are required",
        ERROR_CODES.TEACHING_PROFILE_INCOMPLETE,
      );
    }
  }

  if(isTeacherUpgrade){
    if(teachingSkills || teachingStyles){
        throw new ApiError(
            400,
            "for a teaching account upgarde teachinSkills and teachingStyle are not required",
            ERROR_CODES.INVALID_FIELD_VALUE
        )
    }
  }


  // 4. Check that supplied teaching skills actually exist

  if (isLearnerUpgrade) {
    const existingSkillsCount = await Skill.countDocuments({
      _id: {
        $in: teachingSkills,
      },
    });

    if (existingSkillsCount !== teachingSkills.length) {
      throw new ApiError(
        400,
        "One or more teaching skills do not exist",
        ERROR_CODES.INVALID_FIELD_VALUE,
      );
    }
  }

  // 5. Update account

  user.accountType = accountType;

  if (isLearnerUpgrade) {
    user.teachingSkills = teachingSkills;
    user.teachingStyles = teachingStyles;
  }



  // 6. Save updated user

  const upgradedUser = await user.save();


  return {
    user: upgradedUser
  };
};

const getUserProfileService = async (loggedInUserId, userId) => {
  const pairKey = [
    loggedInUserId.toString(),
    userId.toString(),
  ]
    .sort()
    .join(":");

  const blockedMatchExists = await Match.exists({
    pairKey,
    status: MATCH_STATUSES.BLOCKED,
  });

  if (blockedMatchExists) {
    throw new ApiError(
      404,
      "User not found",
      ERROR_CODES.USER_NOT_FOUND,
    );
  }

  const user = await User.findById(userId).select(
    "_id username fullname avatar accountType languages teachingSkills teachingStyles rating totalReviews connections",
  );

  if (!user) {
    throw new ApiError(
      404,
      "User not found",
      ERROR_CODES.USER_NOT_FOUND,
    );
  }

  const availability = await Availability.find({userId}).select("day startTime endTime")

  return {
    user,
    availability
  };
};

const updateProfileService = async (userId , updateData) => {

    const {fullname , languages , avatar } = updateData

    const user = await User.findById(userId)

    if (!user) {
    throw new ApiError(
      404,
      "User not found",
      ERROR_CODES.USER_NOT_FOUND,
    );
  }

  if(fullname !== undefined){
    user.fullname = fullname
  }

  if(languages !== undefined){
    user.languages = languages
  }

  if(avatar !== undefined){
    user.avatar = avatar
  }



  const updatedUser = await user.save()

  return {
    user: updatedUser
  }
}

const updateTeachingProfileService = async(updateData , userId) => {
    const user = await User.findById(userId)

    if(!user){
        throw new ApiError(
            404,
            "user not found",
            ERROR_CODES.USER_NOT_FOUND
        )
    }

    
    const isTeachingAccount = user.accountType == ACCOUNT_TYPES.TEACHER || user.accountType == ACCOUNT_TYPES.TEACHER_LEARNER

    if(!isTeachingAccount){
        throw new ApiError(
            403,
            "Account type is not permitted to update teaching profile",
            ERROR_CODES.ACCOUNT_TYPE_NOT_PERMITTED,
        );
    }

    const {teachingSkills , teachingStyles} = updateData

    if(teachingSkills){
        const existingSkillsCount = await Skill.countDocuments({
            _id : {
                $in : teachingSkills
            }
        })

        if (existingSkillsCount !== teachingSkills.length) {
            throw new ApiError(
                400,
                "One or more teaching skills do not exist",
                ERROR_CODES.INVALID_FIELD_VALUE,
            );
        }  

        user.teachingSkills = teachingSkills
    }

    if(teachingStyles){
        user.teachingStyles = teachingStyles
    }

    const updatedUser = await user.save()

    return {
        user: updatedUser
    };
}

const changePasswordService = async( UserId , password ) => {

    const user = await User.findById(UserId).select("+password")

     if(!user){
        throw new ApiError(
            404,
            "user not found",
            ERROR_CODES.USER_NOT_FOUND
        )
    }

    const {currentPassword , newPassword} = password

    const isPasswordCorrect = await user.isPasswordCorrect(currentPassword)

    if(!isPasswordCorrect){
        throw new ApiError(
            401,
            "Current password is incorrect",
            ERROR_CODES.INVALID_CREDENTIALS,
        );
    }

    user.password = newPassword

    await user.save()

    return {}

}

export {
  upgradeAccountService,
  getUserProfileService,
  updateTeachingProfileService,
  updateProfileService,
  changePasswordService
};
