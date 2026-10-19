import User from "../../src/models/user.model.js"
import Skill from "../../src/models/skill.model.js"
import Availability from "../../src/models/availability.model.js"
import SkillRequest from "../../src/models/skillRequest.model.js"

const cleanupTestUsers = async () => {
    await User.deleteMany({
        $or: [
            {
                username: {
                    $in: [
                        "testlearner",
                        "testteacher",
                        "testteacherlearner"
                    ]
                }
            },
            {
                email: {
                    $in: [
                        "testlearner@gmail.com",
                        "testteacher@gmail.com",
                        "testteacherlearner@gmail.com"
                    ]
                }
            }
        ]
    })
}

const cleanupTestAvailability = async () => {
    const testUsers = await User.find({
        $or: [
            {
                username: {
                    $in: [
                        "testlearner",
                        "testteacher",
                        "testteacherlearner"
                    ]
                }
            },
            {
                email: {
                    $in: [
                        "testlearner@gmail.com",
                        "testteacher@gmail.com",
                        "testteacherlearner@gmail.com"
                    ]
                }
            }
        ]
    }).select("_id")

    await Availability.deleteMany({
        userId: {
            $in: testUsers.map((user) => user._id)
        }
    })
}

const cleanupTestSkills = async () => {
    await Skill.deleteMany({
        name: {
            $in: [
                "test-update-skill-one",
                "test-update-skill-two"
            ]
        }
    })
}

const cleanupTestSkillRequests = async () => {
    const testUsers = await User.find({
        $or: [
            {
                username: {
                    $in: [
                        "testlearner",
                        "testteacher",
                        "testteacherlearner"
                    ]
                }
            },
            {
                email: {
                    $in: [
                        "testlearner@gmail.com",
                        "testteacher@gmail.com",
                        "testteacherlearner@gmail.com"
                    ]
                }
            }
        ]
    }).select("_id")

    await SkillRequest.deleteMany({
        requestedBy: {
            $in: testUsers.map((user) => user._id)
        }
    })
}

export {
    cleanupTestUsers,
    cleanupTestAvailability,
    cleanupTestSkills,
    cleanupTestSkillRequests
}



