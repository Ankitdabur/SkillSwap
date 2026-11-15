import User from "../../src/models/user.model.js"
import Skill from "../../src/models/skill.model.js"
import Availability from "../../src/models/availability.model.js"
import SkillRequest from "../../src/models/skillRequest.model.js"
import Match from "../../src/models/match.model.js"
import Notification from "../../src/models/notification.model.js"
import Message from "../../src/models/message.model.js"
import Session from "../../src/models/session.model.js"
import CreditTransaction from "../../src/models/creditTransaction.model.js"
import Review from "../../src/models/review.model.js"
import Report from "../../src/models/report.model.js"

const cleanupTestUsers = async () => {
    await User.deleteMany({
        $or: [
            {
                username: {
                    $in: [
                        "testlearner",
                        "testteacher",
                        "testteacherlearner",
                        "testadmin"
                    ]
                }
            },
            {
                email: {
                    $in: [
                        "testlearner@gmail.com",
                        "testteacher@gmail.com",
                        "testteacherlearner@gmail.com",
                        "testadmin@gmail.com"
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
                "test-update-skill-two",
                "test-session-skill",
                "test-session-skill-two"
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
        $or: [
            {
                requestedBy: {
                    $in: testUsers.map((user) => user._id)
                }
            },
            {
                name: {
                    $in: [
                        "test-requested-skill",
                        "test-approved-skill-request",
                        "test-pending-skill-request",
                        "test-pending-skill-request-one",
                        "test-pending-skill-request-two",
                        "test-rejected-skill-request",
                        "test-learner-skill-request",
                        "test-teacher-skill-request"
                    ]
                }
            }
        ]
    })
}

const cleanupTestMatches = async () => {
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

    const testUserIds = testUsers.map((user) => user._id)

    await Match.deleteMany({
        $or: [
            {
                sender: {
                    $in: testUserIds
                }
            },
            {
                receiver: {
                    $in: testUserIds
                }
            }
        ]
    })
}

const cleanupTestNotifications = async () => {
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

    await Notification.deleteMany({
        recipient: {
            $in: testUsers.map((user) => user._id)
        }
    })
}

const cleanupTestMessages = async () => {
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

    const testUserIds = testUsers.map((user) => user._id)

    await Message.deleteMany({
        $or: [
            {
                sender: {
                    $in: testUserIds
                }
            },
            {
                receiver: {
                    $in: testUserIds
                }
            }
        ]
    })
}

const cleanupTestSessions = async () => {
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

    const testUserIds = testUsers.map((user) => user._id)

    await Session.deleteMany({
        $or: [
            {
                teacher: {
                    $in: testUserIds
                }
            },
            {
                learner: {
                    $in: testUserIds
                }
            }
        ]
    })
}

const cleanupTestCreditTransactions = async () => {
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

    await CreditTransaction.deleteMany({
        user: {
            $in: testUsers.map((user) => user._id)
        }
    })
}

const cleanupTestReviews = async () => {
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

    const testUserIds = testUsers.map((user) => user._id)

    await Review.deleteMany({
        $or: [
            {
                reviewer: {
                    $in: testUserIds
                }
            },
            {
                reviewedUser: {
                    $in: testUserIds
                }
            }
        ]
    })
}

const cleanupTestReports = async () => {
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

    const testUserIds = testUsers.map((user) => user._id)

    await Report.deleteMany({
        $or: [
            {
                reportedBy: {
                    $in: testUserIds
                }
            },
            {
                reportedUser: {
                    $in: testUserIds
                }
            },
            {
                reason: {
                    $in: [
                        "Report created for integration testing",
                        "Integration test Session report",
                        "Integration test Message report",
                        "Integration test duplicate report",
                        "Integration test first pending Report",
                        "Integration test second pending Report"
                    ]
                }
            }
        ]
    })
}

export {
    cleanupTestUsers,
    cleanupTestAvailability,
    cleanupTestSkills,
    cleanupTestSkillRequests,
    cleanupTestMatches,
    cleanupTestNotifications,
    cleanupTestMessages,
    cleanupTestSessions,
    cleanupTestCreditTransactions,
    cleanupTestReviews,
    cleanupTestReports
}



