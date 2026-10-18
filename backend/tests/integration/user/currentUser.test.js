import axios from "axios";
import mongoose from "mongoose";
import app from "../../../src/app.js";
import { dbconnect } from "../../../src/db/index.js";
import { generateAccessToken } from "../../../src/utils/token.js";
import { createTestLearner } from "../../helpers/createTestUser.js";
import { authHeader } from "../../helpers/authHeader.js";
import { cleanupTestUsers } from "../../helpers/cleanupTestData.js";

const PORT = process.env.PORT || 8000;
const CURRENT_USER_URL = `http://localhost:${PORT}/api/v1/user/me`;

let server;

const currentUserRequest = async (accessToken) => {
    try {
        return await axios.get(CURRENT_USER_URL, accessToken ? authHeader(accessToken) : undefined);
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

describe("Current User", () => {

    test("Logged in user can get current user information", async () => {
        const { user } = await createTestLearner();
        const accessToken = generateAccessToken(user._id);

        const response = await currentUserRequest(accessToken);

        expect(response.status).toBe(200);
        expect(response.data.message).toBe("Current user information fetched successfully");
        expect(response.data.data.user._id).toBe(user._id.toString());
        expect(response.data.data.user.username).toBe(user.username);
        expect(response.data.data.user.email).toBe(user.email);
        expect(response.data.data.user.fullname).toBe(user.fullname);
        expect(response.data.data.user.accountType).toBe(user.accountType);
    });

    test("Current user response does not expose password or refresh token hash", async () => {
        const { user } = await createTestLearner();
        const accessToken = generateAccessToken(user._id);

        const response = await currentUserRequest(accessToken);

        expect(response.status).toBe(200);
        expect(response.data.data.user.password).toBeUndefined();
        expect(response.data.data.user.refreshTokenHash).toBeUndefined();
    });

    test("User cannot get current user information without access token", async () => {
        await createTestLearner();

        const response = await currentUserRequest();

        expect(response.status).toBe(401);
    });

    test("User cannot get current user information with invalid access token", async () => {
        await createTestLearner();

        const response = await currentUserRequest("invalid-access-token");

        expect(response.status).toBe(401);
    });

});
