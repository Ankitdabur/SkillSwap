import mongoose from "mongoose"
import Report from "../../models/report.model.js"
import Session from "../../models/session.model.js"
import Message from "../../models/message.model.js"
import User from "../../models/user.model.js"
import ApiError from "../../utils/ApiError.js"
import { ERROR_CODES } from "../../constants/errorCodes.js"
import { SESSION_STATUSES } from "../../constants/enums.js"


const createReportService = async (loggedInUser, reportData) => {

    const {
        sessionId,
        messageId,
        reason
    } = reportData

    const databaseSession = await mongoose.startSession()

    let createdReport

    try{
        await databaseSession.withTransaction(async () => {

            let reportedUser

            if(sessionId){
                const existingSession = await Session.findById(sessionId)
                .select("teacher learner status")
                .session(databaseSession)

                if(!existingSession){
                    throw new ApiError(
                        404,
                        "Session not found",
                        ERROR_CODES.RESOURCE_NOT_FOUND
                    )
                }

                if(existingSession.status !== SESSION_STATUSES.COMPLETED){
                    throw new ApiError(
                        409,
                        "Only a completed Session can be reported",
                        ERROR_CODES.INVALID_REQUEST
                    )
                }

                const reporterIsTeacher = existingSession.teacher.equals(
                    loggedInUser
                )
                const reporterIsLearner = existingSession.learner.equals(
                    loggedInUser
                )

                if(!reporterIsTeacher && !reporterIsLearner){
                    throw new ApiError(
                        403,
                        "Only Session participants can submit this Report",
                        ERROR_CODES.FORBIDDEN
                    )
                }

                reportedUser = reporterIsTeacher
                    ? existingSession.learner
                    : existingSession.teacher
            }else{
                const existingMessage = await Message.findById(messageId)
                .select("sender receiver")
                .session(databaseSession)

                if(!existingMessage){
                    throw new ApiError(
                        404,
                        "Message not found",
                        ERROR_CODES.RESOURCE_NOT_FOUND
                    )
                }

                const reporterIsSender = existingMessage.sender.equals(
                    loggedInUser
                )
                const reporterIsReceiver = existingMessage.receiver.equals(
                    loggedInUser
                )

                if(!reporterIsSender && !reporterIsReceiver){
                    throw new ApiError(
                        403,
                        "Only Message participants can submit this Report",
                        ERROR_CODES.FORBIDDEN
                    )
                }

                reportedUser = reporterIsSender
                    ? existingMessage.receiver
                    : existingMessage.sender
            }

            const reports = await Report.create(
                [
                    {
                        session: sessionId,
                        message: messageId,
                        reportedBy: loggedInUser,
                        reportedUser,
                        reason
                    }
                ],
                {
                    session: databaseSession
                }
            )

            createdReport = reports[0]

            const updatedUser = await User.findByIdAndUpdate(
                reportedUser,
                {
                    $inc: {
                        totalReports: 1
                    }
                },
                {
                    new: true,
                    runValidators: true,
                    session: databaseSession
                }
            )

            if(!updatedUser){
                throw new ApiError(
                    404,
                    "Reported user not found",
                    ERROR_CODES.USER_NOT_FOUND
                )
            }
        })
    }catch(error){
        if(error?.code === 11000){
            throw new ApiError(
                409,
                "You have already reported this Session or Message",
                ERROR_CODES.RESOURCE_ALREADY_EXISTS
            )
        }

        throw error
    }finally{
        await databaseSession.endSession()
    }

    return {report: createdReport}
}


const getMyReportsService = async (
    loggedInUser,
    cursor,
    limit
) => {

    let cursorReport = null

    if(cursor){
        cursorReport = await Report.findOne({
            _id: cursor,
            reportedBy: loggedInUser
        }).select("createdAt")

        if(!cursorReport){
            throw new ApiError(
                400,
                "Invalid Report cursor",
                ERROR_CODES.INVALID_FIELD_VALUE
            )
        }
    }

    const reportFilter = {
        reportedBy: loggedInUser,
        ...(cursorReport
            ? {
                $or: [
                    {
                        createdAt: {
                            $lt: cursorReport.createdAt
                        }
                    },
                    {
                        createdAt: cursorReport.createdAt,
                        _id: {
                            $lt: cursorReport._id
                        }
                    }
                ]
            }
            : {})
    }

    const reportResults = await Report.find(reportFilter)
    .sort({
        createdAt: -1,
        _id: -1
    })
    .limit(limit + 1)

    const hasMore = reportResults.length > limit

    const reports = hasMore
        ? reportResults.slice(0, limit)
        : reportResults

    const nextCursor = hasMore
        ? reports[reports.length - 1]._id.toString()
        : null

    return {
        reports,
        pagination: {
            limit,
            nextCursor,
            hasMore
        }
    }
}


export {
    createReportService,
    getMyReportsService
}
