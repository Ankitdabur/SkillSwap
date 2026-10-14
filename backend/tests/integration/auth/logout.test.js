import axios from "axios";
import mongoose from "mongoose";
import User from "../../../src/models/user.model.js";
import { cleanupTestUsers } from "../../helpers/cleanupTestData.js";
import { createTestLearner } from "../../helpers/createTestUser.js";
import { authHeader } from "../../helpers/authHeader.js";
import { dbconnect } from "../../../src/db/index.js";
import app from "../../../src/app.js";
import {
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
} from "../../../src/utils/token.js";


const PORT = process.env.PORT || 3000;

const BACKEND_URL = `http://localhost:${PORT}`;

const LOGOUT_URL = `${BACKEND_URL}/api/v1/auth/logout`;

let server;



describe("POST /api/v1/auth/logout", () => {

  beforeAll(async () => {
    await dbconnect().then(() => {
      server = app.listen(PORT);
    });

  });

  afterEach(async () => {
    await cleanupTestUsers();
  });

  afterAll(async () => {
    await cleanupTestUsers();
    
    await new Promise((resolve) => {
      server.close(resolve);
    });

    await mongoose.disconnect();
  });



  test("should logout authenticated user successfully", async () => {

    const { user } = await createTestLearner();


    const accessToken = generateAccessToken(
      user._id
    );


    const refreshToken = generateRefreshToken(
      user._id
    );


    const refreshTokenHash = await hashRefreshToken(
      refreshToken
    );


    user.refreshTokenHash = refreshTokenHash;

    await user.save();


    const config = authHeader(accessToken);

    config.headers.Cookie =
      `refreshToken=${refreshToken}`;


    const response = await axios.post(
      LOGOUT_URL,
      {},
      config
    );


    expect(response.status).toBe(200);

    expect(response.data.success).toBe(true);


    const loggedOutUser = await User
      .findById(user._id)
      .select("+refreshTokenHash");


    expect(loggedOutUser.refreshTokenHash).toBeNull();


    const setCookie = response.headers["set-cookie"];


    expect(setCookie).toBeDefined();

    expect(
     setCookie.some((cookie) =>
     cookie.startsWith("refreshToken=") )
    ).toBe(true);
});



  test("should reject logout when access token is missing", async () => {

    expect.assertions(1);

    await createTestLearner();


    try {

      await axios.post(
        LOGOUT_URL,
        {}
      );

    } catch (error) {

      expect(error.response.status).toBe(401);

    }

  });



  test("should reject logout with invalid access token", async () => {

    expect.assertions(1);


    await createTestLearner();


    try {

      await axios.post(
        LOGOUT_URL,
        {},
        {
          headers: {
            Authorization:
              "Bearer invalid-access-token",
          },
        }
      );

    } catch (error) {

      expect(error.response.status).toBe(401);

    }

  });



  test("should make refresh token unusable after logout", async () => {

    expect.assertions(2);


    const { user } = await createTestLearner();


    const accessToken = generateAccessToken(
      user._id
    );


    const refreshToken = generateRefreshToken(
      user._id
    );


    const refreshTokenHash = await hashRefreshToken(
      refreshToken
    );


    user.refreshTokenHash = refreshTokenHash;

    await user.save();


    const config = authHeader(accessToken);

    config.headers.Cookie =
      `refreshToken=${refreshToken}`;


    const logoutResponse = await axios.post(
      LOGOUT_URL,
      {},
      config
    );


    expect(logoutResponse.status).toBe(200);


    try {

      await axios.post(
        `${BACKEND_URL}/api/v1/auth/refresh`,
        {},
        {
          headers: {
            Cookie:
              `refreshToken=${refreshToken}`,
          },
        }
      );

    } catch (error) {

      expect(error.response.status).toBe(401);

    }

  });

});
