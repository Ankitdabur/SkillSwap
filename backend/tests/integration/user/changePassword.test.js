import axios from "axios";
import mongoose from "mongoose";
import app from "../../../src/app.js";
import { dbconnect } from "../../../src/db/index.js";
import User from "../../../src/models/user.model.js";
import { generateAccessToken } from "../../../src/utils/token.js";
import { createTestLearner } from "../../helpers/createTestUser.js";
import { authHeader } from "../../helpers/authHeader.js";
import { cleanupTestUsers } from "../../helpers/cleanupTestData.js";

const PORT = process.env.PORT || 8000;
const CHANGE_PASSWORD_URL = `http://localhost:${PORT}/api/v1/user/change-password`;

let server;

const changePasswordRequest = async (body, accessToken) => {
    try {
        return await axios.patch(
            CHANGE_PASSWORD_URL,
            body,
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

describe("Change Password", () => {

    test("User can change password with correct current password", async () => {
        const { user, password } = await createTestLearner();
        const accessToken = generateAccessToken(user._id);
        const newPassword = "NewPassword@123";

        const response = await changePasswordRequest(
            {
                currentPassword: password,
                newPassword
            },
            accessToken
        );

        expect(response.status).toBe(200);
        expect(response.data.message).toBe("Password changed successfully");

        const updatedUser = await User.findById(user._id).select("+password");
        const isNewPasswordCorrect = await updatedUser.isPasswordCorrect(newPassword);
        const isOldPasswordCorrect = await updatedUser.isPasswordCorrect(password);

        expect(isNewPasswordCorrect).toBe(true);
        expect(isOldPasswordCorrect).toBe(false);
    });

    test("User cannot change password with incorrect current password", async () => {
        const { user, password } = await createTestLearner();
        const accessToken = generateAccessToken(user._id);

        const response = await changePasswordRequest(
            {
                currentPassword: "WrongPassword@123",
                newPassword: "NewPassword@123"
            },
            accessToken
        );

        expect(response.status).toBe(401);

        const updatedUser = await User.findById(user._id).select("+password");
        const isOldPasswordCorrect = await updatedUser.isPasswordCorrect(password);

        expect(isOldPasswordCorrect).toBe(true);
    });

    test("User cannot change password without access token", async () => {
        await createTestLearner();

        const response = await changePasswordRequest({
            currentPassword: "Password@123",
            newPassword: "NewPassword@123"
        });

        expect(response.status).toBe(401);
    });

    test("Current password is required", async () => {
        const { user } = await createTestLearner();
        const accessToken = generateAccessToken(user._id);

        const response = await changePasswordRequest(
            {
                newPassword: "NewPassword@123"
            },
            accessToken
        );

        expect(response.status).toBe(400);
    });

    test("New password is required", async () => {
        const { user, password } = await createTestLearner();
        const accessToken = generateAccessToken(user._id);

        const response = await changePasswordRequest(
            {
                currentPassword: password
            },
            accessToken
        );

        expect(response.status).toBe(400);
    });
});
