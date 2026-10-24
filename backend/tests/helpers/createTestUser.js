import mongoose from "mongoose"
import User from "../../src/models/user.model.js"
import Skill from "../../src/models/skill.model.js"
import SkillRequest from "../../src/models/skillRequest.model.js"
import Match from "../../src/models/match.model.js"
import {
    ACCOUNT_TYPES,
    TEACHING_STYLES,
    LANGUAGES,
    SKILL_CATEGORIES,
    SKILL_REQUEST_STATUSES,
    MATCH_STATUSES
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

const createTestTeacher = async () => {
    const password = "Password@123"

    const user = await User.create({
        fullname: "Test Teacher",
        username: "testteacher",
        email: "testteacher@gmail.com",
        password,
        accountType: ACCOUNT_TYPES.TEACHER,
        languages: [LANGUAGES.ENGLISH],
        teachingSkills: [
            new mongoose.Types.ObjectId()
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

const createTestTeacherLearner = async () => {
    const password = "Password@123"

    const user = await User.create({
        fullname: "Test Teacher Learner",
        username: "testteacherlearner",
        email: "testteacherlearner@gmail.com",
        password,
        accountType: ACCOUNT_TYPES.TEACHER_LEARNER,
        languages: [LANGUAGES.ENGLISH],
        teachingSkills: [
            new mongoose.Types.ObjectId()
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

export {
    createTestLearner,
    createTestTeacher,
    createTestTeacherLearner,
    createTestSkill,
    createTestSkillRequest,
    createTestMatch
}
