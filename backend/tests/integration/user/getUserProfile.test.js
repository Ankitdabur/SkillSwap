import axios from "axios";
import mongoose from "mongoose";
import app from "../../../src/app.js";
import { dbconnect } from "../../../src/db/index.js";
import Availability from "../../../src/models/availability.model.js";
import { generateAccessToken } from "../../../src/utils/token.js";
import {
    DAYS_OF_WEEK,
    MATCH_STATUSES
} from "../../../src/constants/enums.js";
import { ERROR_CODES } from "../../../src/constants/errorCodes.js";
import {
    createTestLearner,
    createTestTeacher,
    createTestMatch
} from "../../helpers/createTestUser.js";
import { authHeader } from "../../helpers/authHeader.js";
import {
    cleanupTestAvailability,
    cleanupTestMatches,
    cleanupTestUsers
} from "../../helpers/cleanupTestData.js";

const PORT = process.env.PORT || 8000;
const USER_PROFILE_URL = `http://localhost:${PORT}/api/v1/user`;

let server;

const getUserProfileRequest = async (userId, accessToken) => {
    try {
        return await axios.get(
            `${USER_PROFILE_URL}/${userId}`,
            accessToken ? authHeader(accessToken) : undefined
        );
    } catch (error) {
        return error.response;
    }
};

beforeAll(async () => {
    await dbconnect();
    server = app.listen(PORT);
});

afterEach(async () => {
    await cleanupTestAvailability();
    await cleanupTestMatches();
    await cleanupTestUsers();
});

afterAll(async () => {
    await cleanupTestAvailability();
    await cleanupTestMatches();
    await cleanupTestUsers();
    await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
});

describe("Get User Profile", () => {

    test("Logged in user can get another user's profile", async () => {
        const { user: learner } = await createTestLearner();
        const { user: teacher } = await createTestTeacher();
        const accessToken = generateAccessToken(learner._id);

        await Availability.create([
            {
                userId: teacher._id,
                day: DAYS_OF_WEEK.MONDAY,
                startTime: "10:00",
                endTime: "12:00"
            },
            {
                userId: teacher._id,
                day: DAYS_OF_WEEK.TUESDAY,
                startTime: "14:00",
                endTime: "16:00"
            }
        ], {
            ordered: true
        });

        const response = await getUserProfileRequest(teacher._id, accessToken);

        expect(response.status).toBe(200);
        expect(response.data.data.user._id).toBe(teacher._id.toString());
        expect(response.data.data.user.username).toBe(teacher.username);
        expect(response.data.data.user.fullname).toBe(teacher.fullname);
        expect(response.data.data.user.accountType).toBe(teacher.accountType);
        expect(response.data.data.user.languages).toEqual(teacher.languages);
        expect(response.data.data.user.teachingStyles).toEqual(teacher.teachingStyles);
        expect(response.data.data.availability).toHaveLength(2);
        expect(response.data.data.availability).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    day: DAYS_OF_WEEK.MONDAY,
                    startTime: "10:00",
                    endTime: "12:00"
                }),
                expect.objectContaining({
                    day: DAYS_OF_WEEK.TUESDAY,
                    startTime: "14:00",
                    endTime: "16:00"
                })
            ])
        );
    });

    test("User profile does not expose private fields", async () => {
        const { user: learner } = await createTestLearner();
        const { user: teacher } = await createTestTeacher();
        const accessToken = generateAccessToken(learner._id);

        const response = await getUserProfileRequest(teacher._id, accessToken);

        expect(response.status).toBe(200);
        expect(response.data.data.user.email).toBeUndefined();
        expect(response.data.data.user.password).toBeUndefined();
        expect(response.data.data.user.refreshTokenHash).toBeUndefined();
        expect(response.data.data.user.role).toBeUndefined();
        expect(response.data.data.user.credits).toBeUndefined();
        expect(response.data.data.user.reservedCredits).toBeUndefined();
    });

    test("User cannot get profile without access token", async () => {
        const { user } = await createTestLearner();

        const response = await getUserProfileRequest(user._id);

        expect(response.status).toBe(401);
    });

    test("Invalid user id is rejected", async () => {
        const { user } = await createTestLearner();
        const accessToken = generateAccessToken(user._id);

        const response = await getUserProfileRequest("invalid-user-id", accessToken);

        expect(response.status).toBe(400);
    });

    test("User profile returns 404 when user does not exist", async () => {
        const { user } = await createTestLearner();
        const accessToken = generateAccessToken(user._id);
        const nonExistingUserId = new mongoose.Types.ObjectId();

        const response = await getUserProfileRequest(nonExistingUserId, accessToken);

        expect(response.status).toBe(404);
    });

    test("Blocker cannot view the blocked user's profile", async () => {
        const { user: blocker } = await createTestLearner();
        const { user: blockedUser } = await createTestTeacher();
        const accessToken = generateAccessToken(blocker._id);

        await createTestMatch(
            blocker._id,
            blockedUser._id,
            MATCH_STATUSES.BLOCKED,
            blocker._id
        );

        const response = await getUserProfileRequest(
            blockedUser._id,
            accessToken
        );

        expect(response.status).toBe(404);
        expect(response.data.code).toBe(ERROR_CODES.USER_NOT_FOUND);
    });

    test("Blocked user cannot view the blocker's profile", async () => {
        const { user: blocker } = await createTestLearner();
        const { user: blockedUser } = await createTestTeacher();
        const accessToken = generateAccessToken(blockedUser._id);

        await createTestMatch(
            blocker._id,
            blockedUser._id,
            MATCH_STATUSES.BLOCKED,
            blocker._id
        );

        const response = await getUserProfileRequest(
            blocker._id,
            accessToken
        );

        expect(response.status).toBe(404);
        expect(response.data.code).toBe(ERROR_CODES.USER_NOT_FOUND);
    });

});
