import axios from "axios";
import mongoose from "mongoose";
import User from "../../../src/models/user.model.js";
import { cleanupTestUsers } from "../../helpers/cleanupTestData.js";
import { createTestLearner } from "../../helpers/createTestUser.js";
import { dbconnect } from "../../../src/db/index.js";
import app from "../../../src/app.js";


const PORT = process.env.PORT || 3000;

const BACKEND_URL = `http://localhost:${PORT}`;

const LOGIN_URL = `${BACKEND_URL}/api/v1/auth/login`;

let server;


describe("POST /api/v1/auth/login", () => {

  beforeAll(async () => {

    await dbconnect();

    server = app.listen(PORT);

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



  test("should login successfully using username", async () => {

    const {
      user,
      password
    } = await createTestLearner();


    const response = await axios.post(
      LOGIN_URL,
      {
        identifier: user.username,
        password
      }
    );


    expect(response.status).toBe(200);

    expect(response.data.success).toBe(true);

    expect(response.data.data).toBeDefined();

    expect(
      response.data.data.accessToken
    ).toBeDefined();

    expect(
      response.data.data.user.username
    ).toBe(user.username);

    expect(
      response.data.data.user.email
    ).toBe(user.email);

    expect(
      response.data.data.user.password
    ).toBeUndefined();

    expect(
      response.data.data.user.refreshTokenHash
    ).toBeUndefined();

  });



  test("should login successfully using email", async () => {

    const {
      user,
      password
    } = await createTestLearner();


    const response = await axios.post(
      LOGIN_URL,
      {
        identifier: user.email,
        password
      }
    );


    expect(response.status).toBe(200);

    expect(response.data.success).toBe(true);

    expect(
      response.data.data.accessToken
    ).toBeDefined();

    expect(
      response.data.data.user.email
    ).toBe(user.email);

  });



  test("should set refresh token cookie after successful login", async () => {

    const {
      user,
      password
    } = await createTestLearner();


    const response = await axios.post(
      LOGIN_URL,
      {
        identifier: user.username,
        password
      }
    );


    const setCookie =
      response.headers["set-cookie"];


    expect(setCookie).toBeDefined();

    expect(
      setCookie.some((cookie) =>
        cookie.startsWith("refreshToken=")
      )
    ).toBe(true);

  });



  test("should store refresh token hash in database after login", async () => {

    const {
      user,
      password
    } = await createTestLearner();


    await axios.post(
      LOGIN_URL,
      {
        identifier: user.username,
        password
      }
    );


    const loggedInUser = await User
      .findById(user._id)
      .select("+refreshTokenHash");


    expect(
      loggedInUser.refreshTokenHash
    ).toBeDefined();

    expect(
      loggedInUser.refreshTokenHash
    ).not.toBeNull();

  });



  test("should reject login with incorrect password", async () => {

    expect.assertions(1);


    const { user } =
      await createTestLearner();


    try {

      await axios.post(
        LOGIN_URL,
        {
          identifier: user.username,
          password: "WrongPassword@123"
        }
      );

    } catch (error) {

      expect(error.response.status).toBe(401);

    }

  });



  test("should reject login with invalid username", async () => {

    expect.assertions(1);


    const { password } = await createTestLearner();


    try {

      await axios.post(
        LOGIN_URL,
        {
          identifier: "invalidusername",
          password
        }
      );

    } catch (error) {

      expect(error.response.status).toBe(401);

    }

  });



  test("should reject login with invalid email", async () => {

    expect.assertions(1);


    const { password } =
      await createTestLearner();


    try {

      await axios.post(
        LOGIN_URL,
        {
          identifier: "invalid@gmail.com",
          password
        }
      );

    } catch (error) {

      expect(
        error.response.status
      ).toBe(401);

    }

  });

});
