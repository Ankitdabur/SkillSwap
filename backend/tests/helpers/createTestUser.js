import mongoose from "mongoose"
import User from "../../src/models/user.model.js"
import Skill from "../../src/models/skill.model.js"
import SkillRequest from "../../src/models/skillRequest.model.js"
import Match from "../../src/models/match.model.js"
import Notification from "../../src/models/notification.model.js"
import Message from "../../src/models/message.model.js"
import Session from "../../src/models/session.model.js"
import {
    ACCOUNT_TYPES,
    COMPLETION_METHODS,
    TEACHING_STYLES,
    LANGUAGES,
    SKILL_CATEGORIES,
    SKILL_REQUEST_STATUSES,
    MATCH_STATUSES,
    NOTIFICATION_TYPES,
    SESSION_DURATIONS,
    SESSION_STATUSES,
    SESSION_TYPES
} from "../../src/constants/enums.js"

const createTestLearner = async () => {
    const password = "Password@123"

    const user = await User.create({
        fullname: "Test Learner",
        username: "testlearner",
        email: "testlearner@gmail.com",
        password,
        accountType: ACCOUNT_TYPES.LEARNER,
        languages: [LANGUAGES.ENGLISH]
    })

    return {
        user,
        password
    }
}

const createTestTeacher = async (
    teachingSkillId = new mongoose.Types.ObjectId()
) => {
    const password = "Password@123"

    const user = await User.create({
        fullname: "Test Teacher",
        username: "testteacher",
        email: "testteacher@gmail.com",
        password,
        accountType: ACCOUNT_TYPES.TEACHER,
        languages: [LANGUAGES.ENGLISH],
        teachingSkills: [
            teachingSkillId
        ],
        teachingStyles: [
            TEACHING_STYLES.STEP_BY_STEP
        ]
    })

    return {
        user,
        password
    }
}

const createTestTeacherLearner = async (
    teachingSkillId = new mongoose.Types.ObjectId()
) => {
    const password = "Password@123"

    const user = await User.create({
        fullname: "Test Teacher Learner",
        username: "testteacherlearner",
        email: "testteacherlearner@gmail.com",
        password,
        accountType: ACCOUNT_TYPES.TEACHER_LEARNER,
        languages: [LANGUAGES.ENGLISH],
        teachingSkills: [
            teachingSkillId
        ],
        teachingStyles: [
            TEACHING_STYLES.STEP_BY_STEP
        ]
    })

    return {
        user,
        password
    }
}

const createTestSkill = async (name, displayName) => {
    const skill = await Skill.create({
        name,
        displayName,
        category: SKILL_CATEGORIES.TECHNOLOGY_PROGRAMMING,
        description: "Skill created for integration testing"
    })

    return skill
}

const createTestSkillRequest = async (
    requestedBy,
    name,
    status = SKILL_REQUEST_STATUSES.PENDING
) => {
    const skillRequest = await SkillRequest.create({
        requestedBy,
        name,
        category: SKILL_CATEGORIES.TECHNOLOGY_PROGRAMMING,
        description: "Skill request created for integration testing",
        status,
        adminResponse: status === SKILL_REQUEST_STATUSES.REJECTED
            ? "Skill request rejected for integration testing"
            : null
    })

    return skillRequest
}

const createTestMatch = async (
    senderId,
    receiverId,
    status = MATCH_STATUSES.PENDING,
    blockedBy = null
) => {
    const match = await Match.create({
        sender: senderId,
        receiver: receiverId,
        status,
        blockedBy: status === MATCH_STATUSES.BLOCKED
            ? blockedBy || senderId
            : null
    })

    if(status === MATCH_STATUSES.ACCEPTED){
        await User.updateMany(
            {
                _id: {
                    $in: [senderId, receiverId]
                }
            },
            {
                $inc: {
                    connections: 1
                }
            }
        )
    }

    return match
}

const createTestNotification = async (
    recipient,
    type = NOTIFICATION_TYPES.MATCH_REQUEST_RECEIVED,
    message = "Notification created for integration testing",
    isRead = false
) => {
    const notification = await Notification.create({
        recipient,
        type,
        message,
        isRead
    })

    return notification
}

const createTestMessage = async (
    senderId,
    receiverId,
    content = "Message created for integration testing",
    isRead = false,
    isDeleted = false
) => {
    const message = await Message.create({
        sender: senderId,
        receiver: receiverId,
        content,
        isRead,
        isDeleted
    })

    return message
}

const createTestSession = async (
    teacherId,
    learnerId,
    skillId,
    status = SESSION_STATUSES.PENDING,
    overrides = {}
) => {
    const sessionType = overrides.sessionType || SESSION_TYPES.REGULAR

    const session = await Session.create({
        teacher: teacherId,
        learner: learnerId,
        skill: skillId,
        scheduledAt: new Date(
            Date.now() + 24 * 60 * 60 * 1000
        ),
        duration: SESSION_DURATIONS.ONE_HOUR,
        credits: sessionType === SESSION_TYPES.DEMO ? 0 : 10,
        status,
        sessionType,
        meetingLink: [
            SESSION_STATUSES.PENDING,
            SESSION_STATUSES.REJECTED
        ].includes(status)
            ? null
            : "https://meet.example.com/test-session",
        completionMethod: status === SESSION_STATUSES.COMPLETED
            ? COMPLETION_METHODS.BOTH_CONFIRMED
            : null,
        ...overrides
    })

    return session
}

export {
    createTestLearner,
    createTestTeacher,
    createTestTeacherLearner,
    createTestSkill,
    createTestSkillRequest,
    createTestMatch,
    createTestNotification,
    createTestMessage,
    createTestSession
}
