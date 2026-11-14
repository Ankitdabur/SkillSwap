import axios from "axios";
import mongoose from "mongoose";
import User from "../../../src/models/user.model.js";

import { cleanupTestUsers } from "../../helpers/cleanupTestData.js";
import { createTestLearner } from "../../helpers/createTestUser.js";

import { dbconnect } from "../../../src/db/index.js";
import app from "../../../src/app.js";
import { ACCOUNT_STATUSES } from "../../../src/constants/enums.js";
import { ERROR_CODES } from "../../../src/constants/errorCodes.js";

import {
  generateRefreshToken,
  hashRefreshToken,
} from "../../../src/utils/token.js";


const PORT = process.env.PORT || 3000;

const BACKEND_URL = `http://localhost:${PORT}`;

const REFRESH_URL = `${BACKEND_URL}/api/v1/auth/refresh`;



let server

describe("POST /api/v1/auth/refresh", () => {

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



  test("should generate a new access token with valid refresh token", async () => {

    const { user } = await createTestLearner();


    const refreshToken = generateRefreshToken(
      user._id
    );


    const refreshTokenHash = await hashRefreshToken(
      refreshToken
    );


    user.refreshTokenHash = refreshTokenHash;

    await user.save();


    const response = await axios.post(
      REFRESH_URL,
      {},
      {
        headers: {
          Cookie: `refreshToken=${refreshToken}`,
        },
      }
    );


    expect(response.status).toBe(200);

    expect(response.data.success).toBe(true);

    expect(
      response.data.data.accessToken
    ).toBeDefined();


    const setCookie = response.headers["set-cookie"];


    expect(setCookie).toBeDefined();

    expect(
      setCookie.some((cookie) =>
        cookie.startsWith("refreshToken=")
      )
    ).toBe(true);

  });



  test("should reject refresh request when refresh token cookie is missing", async () => {

    expect.assertions(1);


    await createTestLearner();


    try {

      await axios.post(
        REFRESH_URL,
        {}
      );

    } catch (error) {

      expect(error.response.status).toBe(401);

    }

  });



  test("should reject invalid refresh token", async () => {

    expect.assertions(1);


    await createTestLearner();


    try {

      await axios.post(
        REFRESH_URL,
        {},
        {
          headers: {
            Cookie: "refreshToken=invalid-refresh-token",
          },
        }
      );

    } catch (error) {

      expect(error.response.status).toBe(401);

    }

  });



  test("should reject refresh token when it does not match stored refresh token hash", async () => {

    expect.assertions(1);


    const { user } = await createTestLearner();


    const storedRefreshToken = generateRefreshToken(
      user._id
    );


    const storedRefreshTokenHash = await hashRefreshToken(
      storedRefreshToken
    );


    user.refreshTokenHash = storedRefreshTokenHash;

    await user.save();


    const differentRefreshToken = generateRefreshToken(
      new mongoose.Types.ObjectId()
    );


    try {

      await axios.post(
        REFRESH_URL,
        {},
        {
          headers: {
            Cookie: `refreshToken=${differentRefreshToken}`,
          },
        }
      );

    } catch (error) {

      expect(error.response.status).toBe(401);

    }

  });



  test("should rotate refresh token and invalidate the old refresh token", async () => {

    expect.assertions(6);


    const { user } = await createTestLearner();


    const refreshToken = generateRefreshToken(
      user._id
    );


    const refreshTokenHash = await hashRefreshToken(
      refreshToken
    );


    user.refreshTokenHash = refreshTokenHash;

    await user.save();


    const firstResponse = await axios.post(
      REFRESH_URL,
      {},
      {
        headers: {
          Cookie: `refreshToken=${refreshToken}`,
        },
      }
    );


    expect(firstResponse.status).toBe(200);


    const setCookie =
      firstResponse.headers["set-cookie"];


    expect(setCookie).toBeDefined();


    const refreshCookie = setCookie.find(
      (cookie) =>
        cookie.startsWith("refreshToken=")
    );


    const newRefreshToken = refreshCookie.split(";")[0].split("=")[1];
        
        


    expect(newRefreshToken).toBeDefined();


    try {

      await axios.post(
        REFRESH_URL,
        {},
        {
          headers: {
            Cookie: `refreshToken=${refreshToken}`,
          },
        }
      );

    } catch (error) {

      expect(error.response.status).toBe(401);

    }

  

    const secondResponse = await axios.post(
      REFRESH_URL,
      {},
      {
        headers: {
          Cookie: `refreshToken=${newRefreshToken}`,
        },
      }
    );


    expect(secondResponse.status).toBe(200);

    expect(
      secondResponse.data.data.accessToken
    ).toBeDefined();

  });



  test("should reject refresh for suspended account", async () => {

    expect.assertions(2);


    const { user } = await createTestLearner();


    const refreshToken = generateRefreshToken(
      user._id
    );


    await User.findByIdAndUpdate(
      user._id,
      {
        $set: {
          accountStatus: ACCOUNT_STATUSES.SUSPENDED,
          suspendedUntil: new Date(
            Date.now() + 24 * 60 * 60 * 1000
          )
        },
        $unset: {
          refreshTokenHash: 1
        }
      },
      {
        runValidators: true
      }
    );


    try {

      await axios.post(
        REFRESH_URL,
        {},
        {
          headers: {
            Cookie: `refreshToken=${refreshToken}`,
          },
        }
      );

    } catch (error) {

      expect(error.response.status).toBe(403);
      expect(error.response.data.code).toBe(
        ERROR_CODES.ACCOUNT_SUSPENDED
      );

    }

  });



  test("should reject refresh for banned account", async () => {

    expect.assertions(2);


    const { user } = await createTestLearner();


    const refreshToken = generateRefreshToken(
      user._id
    );


    await User.findByIdAndUpdate(
      user._id,
      {
        $set: {
          accountStatus: ACCOUNT_STATUSES.BANNED,
          suspendedUntil: null
        },
        $unset: {
          refreshTokenHash: 1
        }
      },
      {
        runValidators: true
      }
    );


    try {

      await axios.post(
        REFRESH_URL,
        {},
        {
          headers: {
            Cookie: `refreshToken=${refreshToken}`,
          },
        }
      );

    } catch (error) {

      expect(error.response.status).toBe(403);
      expect(error.response.data.code).toBe(
        ERROR_CODES.ACCOUNT_BANNED
      );

    }

  });

});
