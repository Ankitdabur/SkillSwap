import User from "../../models/user.model.js"
import Skill from "../../models/skill.model.js"
import Availability from "../../models/availability.model.js"
import Match from "../../models/match.model.js"
import ApiError from "../../utils/ApiError.js"
import { ERROR_CODES } from "../../constants/errorCodes.js"
import {
    ACCOUNT_TYPES,
    MATCH_STATUSES
} from "../../constants/enums.js"
import mongoose from "mongoose"
import {
    getTotalOverlapMinutes,
    getAvailabilityScore,
    getRatingScore,
    getReviewScore,
    getExperienceScore
} from "./helper.functions.js"


const discoverTeachersService = async ( learnerId, discoveryQuery) => {

    const {
        skillId,
        teachingStyle,
        page,
        limit
    } = discoveryQuery


    const learner = await User.findById(learnerId).select("languages")

    if(!learner){
        throw new ApiError(
            404,
            "Learner not found",
            ERROR_CODES.USER_NOT_FOUND
        )
    }


    const skill = await Skill.findById(skillId).select("_id")

    if(!skill){
        throw new ApiError(
            404,
            "Skill not found",
            ERROR_CODES.RESOURCE_NOT_FOUND
        )
    }


    const blockedMatches = await Match.find({
        status: MATCH_STATUSES.BLOCKED,
        $or: [
            {
                sender: learner._id
            },
            {
                receiver: learner._id
            }
        ]
    }).select("sender receiver")

    const blockedUserIds = blockedMatches.map((match) => {
        if(match.sender.equals(learner._id)){
            return match.receiver
        }

        return match.sender
    })


    const teacherMatch = {
        _id: {
            $nin: [
                learner._id,
                ...blockedUserIds
            ]
        },

        accountType: {
            $in: [
                ACCOUNT_TYPES.TEACHER,
                ACCOUNT_TYPES.TEACHER_LEARNER
            ]
        },

        teachingSkills: {
            $in: [
                new mongoose.Types.ObjectId(skillId)
            ]
        },

        languages: {
            $in: learner.languages
        }
    }

    if(teachingStyle){
        teacherMatch.teachingStyles = teachingStyle
    }



    const teachers = await User.aggregate([
        {
            $match: teacherMatch
        },
        {
            $lookup : {
                from : "availabilities",
                localField : "_id",
                foreignField : "userId",
                as : "availability",

                pipeline : [
                    {
                        $project : {
                            day : 1,
                            endTime : 1,
                            startTime : 1,
                            _id : 0
                        }
                    }
                ]
           }
        },
        {
            $lookup : {
                from : "sessions",
                localField : "_id",
                foreignField : "teacher",

                pipeline : [
                    {
                        $match : {
                            skill : new mongoose.Types.ObjectId(skillId),
                            status : "COMPLETED",
                            sessionType : "REGULAR",
                        }
                    },
                    {
                        $count : "count"  // if no document found then completedSessions []
                    },

                ],
                as : "completedSessions"                
            }
        },
        { 
            $project : {
                fullname : 1,
                avatar : 1,
                rating : 1,
                totalReviews : 1,
                completedSessions : 1,
                availability : 1
            }
        }
    ])

    const learnerAvailability = await Availability.find({userId : learnerId})

    const scoredTeachers = teachers.map((teacher) => {

        const overlapMinutes = getTotalOverlapMinutes(
            learnerAvailability , 
            teacher.availability)


            const availabilityScore = getAvailabilityScore(overlapMinutes)


            const ratingScore = getRatingScore(teacher.rating)


            const reviewScore = getReviewScore(teacher.totalReviews)


            const completedSkillSessions = teacher.completedSessions[0]?.count || 0


            const experienceScore = getExperienceScore(completedSkillSessions)


            const compatibilityScore =
                (ratingScore * 0.30) +
                (availabilityScore * 0.35) +
                (experienceScore * 0.25) +
                (reviewScore * 0.10)


            return {
                ...teacher,

                overlapMinutes,

                scores: {
                    ratingScore,
                    availabilityScore,
                    experienceScore,
                    reviewScore,
                    compatibilityScore
                }
            }

    })


    scoredTeachers.sort((a, b) => {
    const compatibilityDifference =
        b.scores.compatibilityScore -
        a.scores.compatibilityScore

    if(compatibilityDifference !== 0){
        return compatibilityDifference
    }

    const ratingDifference = b.rating - a.rating

    if(ratingDifference !== 0){
        return ratingDifference
    }

    const reviewDifference =
        b.totalReviews - a.totalReviews

    if(reviewDifference !== 0){
        return reviewDifference
    }
    })

    const skip = (page - 1) * limit
    const totalTeachers = scoredTeachers.length
    const totalPages = Math.ceil(totalTeachers / limit)
    const paginatedTeachers = scoredTeachers.slice(skip , skip + limit )

    return {
        scoredTeachers : paginatedTeachers,
        pagination : {
            page,
            limit,
            totalTeachers,
            totalPages
        }
    }
 
}


export {
    discoverTeachersService
}
