import mongoose from "mongoose"
import User from "../../models/user.model.js"
import ApiError from "../../utils/ApiError.js"
import { ERROR_CODES } from "../../constants/errorCodes.js"
import {
    ACCOUNT_STATUSES,
    NOTIFICATION_TYPES,
    USER_ROLES
} from "../../constants/enums.js"
import { createNotificationService } from "../notifications/notification.service.js"


const formatSuspensionExpiry = (suspendedUntil) => {
    return suspendedUntil.toLocaleString(
        "en-IN",
        {
            timeZone: "Asia/Kolkata",
            dateStyle: "medium",
            timeStyle: "short"
        }
    )
}


const checkUserAccountStatus = async (user) => {

    if(
        user.role === USER_ROLES.ADMIN ||
        user.accountStatus === ACCOUNT_STATUSES.ACTIVE
    ){
        return user
    }

    if(user.accountStatus === ACCOUNT_STATUSES.BANNED){
        throw new ApiError(
            403,
            "Your account is permanently banned",
            ERROR_CODES.ACCOUNT_BANNED
        )
    }

    const now = new Date()

    if(
        !user.suspendedUntil ||
        user.suspendedUntil > now
    ){
        const suspensionMessage = user.suspendedUntil
            ? `Your account is suspended until ${formatSuspensionExpiry(user.suspendedUntil)}`
            : "Your account is temporarily suspended"

        throw new ApiError(
            403,
            suspensionMessage,
            ERROR_CODES.ACCOUNT_SUSPENDED
        )
    }

    const databaseSession = await mongoose.startSession()

    let reactivatedUser

    try{
        await databaseSession.withTransaction(async () => {

            reactivatedUser = await User.findOneAndUpdate(
                {
                    _id: user._id,
                    accountStatus: ACCOUNT_STATUSES.SUSPENDED,
                    suspendedUntil: {
                        $lte: now
                    }
                },
                {
                    accountStatus: ACCOUNT_STATUSES.ACTIVE,
                    suspendedUntil: null
                },
                {
                    new: true,
                    runValidators: true,
                    session: databaseSession
                }
            )

            if(reactivatedUser){
                await createNotificationService(
                    {
                        recipient: reactivatedUser._id,
                        type: NOTIFICATION_TYPES.ACCOUNT_REACTIVATED,
                        message: "Your account has been reactivated automatically"
                    },
                    databaseSession
                )
            }
        })
    }finally{
        await databaseSession.endSession()
    }

    if(reactivatedUser){
        return reactivatedUser
    }

    const currentUser = await User.findById(user._id)

    if(!currentUser){
        throw new ApiError(
            401,
            "User not found",
            ERROR_CODES.INVALID_ACCESS_TOKEN
        )
    }

    return checkUserAccountStatus(currentUser)
}


export {checkUserAccountStatus}
