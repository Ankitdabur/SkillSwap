import axios from "axios";
import mongoose from "mongoose";
import app from "../../../src/app.js";
import { dbconnect } from "../../../src/db/index.js";
import { generateAccessToken } from "../../../src/utils/token.js";
import { createTestLearner, createTestTeacher } from "../../helpers/createTestUser.js";
import { authHeader } from "../../helpers/authHeader.js";
import { cleanupTestUsers } from "../../helpers/cleanupTestData.js";

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
    await cleanupTestUsers();
});

afterAll(async () => {
    await cleanupTestUsers();
    await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
});

describe("Get User Profile", () => {

    test("Logged in user can get another user's profile", async () => {
        const { user: learner } = await createTestLearner();
        const { user: teacher } = await createTestTeacher();
        const accessToken = generateAccessToken(learner._id);

        const response = await getUserProfileRequest(teacher._id, accessToken);

        expect(response.status).toBe(200);
        expect(response.data.data._id).toBe(teacher._id.toString());
        expect(response.data.data.username).toBe(teacher.username);
        expect(response.data.data.fullname).toBe(teacher.fullname);
        expect(response.data.data.accountType).toBe(teacher.accountType);
        expect(response.data.data.languages).toEqual(teacher.languages);
        expect(response.data.data.teachingStyles).toEqual(teacher.teachingStyles);
    });

    test("User profile does not expose private fields", async () => {
        const { user: learner } = await createTestLearner();
        const { user: teacher } = await createTestTeacher();
        const accessToken = generateAccessToken(learner._id);

        const response = await getUserProfileRequest(teacher._id, accessToken);

        expect(response.status).toBe(200);
        expect(response.data.data.email).toBeUndefined();
        expect(response.data.data.password).toBeUndefined();
        expect(response.data.data.refreshTokenHash).toBeUndefined();
        expect(response.data.data.role).toBeUndefined();
        expect(response.data.data.credits).toBeUndefined();
        expect(response.data.data.reservedCredits).toBeUndefined();
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

});
