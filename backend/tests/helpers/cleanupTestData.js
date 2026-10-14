import User from "../../src/models/user.model.js"
import Skill from "../../src/models/skill.model.js"

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

export {
    cleanupTestUsers,
    cleanupTestSkills
}



