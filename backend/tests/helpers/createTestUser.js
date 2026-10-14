import mongoose from "mongoose"
import User from "../../src/models/user.model.js"
import Skill from "../../src/models/skill.model.js"
import {
    ACCOUNT_TYPES,
    TEACHING_STYLES,
    LANGUAGES,
    SKILL_CATEGORIES
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

export {
    createTestLearner,
    createTestTeacher,
    createTestTeacherLearner,
    createTestSkill
}
