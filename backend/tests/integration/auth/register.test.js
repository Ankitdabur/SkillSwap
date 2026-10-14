import axios from "axios";
import mongoose from "mongoose";
import { cleanupTestUsers } from "../../helpers/cleanupTestData.js";
import { dbconnect } from "../../../src/db/index.js";
import app from "../../../src/app.js";
import {
  ACCOUNT_TYPES,
  LANGUAGES,
} from "../../../src/constants/enums.js";
import {
  createTestLearner,
} from "../../helpers/createTestUser.js";

const PORT = process.env.PORT || 3000;

const BACKEND_URL = `http://localhost:${process.env.PORT}`;

const REGISTER_URL = `${BACKEND_URL}/api/v1/auth/register`;


let server

describe("POST /api/v1/auth/register", () => {

  beforeAll(async () => {
      await dbconnect().then(() => {
       server = app.listen(PORT);
     });
  })
 
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


  test("should register a learner successfully", async () => {

    const userData = {
      fullname: "Test Learner",
      username: "testlearner",
      email: "testlearner@gmail.com",
      password: "Password@123",
      accountType: ACCOUNT_TYPES.LEARNER,
      languages: [LANGUAGES.ENGLISH],
    };


    const response = await axios.post(
      REGISTER_URL,
      userData
    );


    expect(response.status).toBe(201);

    expect(response.data.success).toBe(true);

    expect(response.data.data).toBeDefined();

    expect(response.data.data.username).toBe(
      userData.username
    );

    expect(response.data.data.email).toBe(
      userData.email
    );

    expect(response.data.data.accountType).toBe(
      ACCOUNT_TYPES.LEARNER
    );

    expect(response.data.data.password).toBeUndefined();

    expect(
      response.data.data.refreshTokenHash
    ).toBeUndefined();
  });


  test("should reject registration when username is missing", async () => {

    expect.assertions(1);


    const userData = {
      fullname: "Test Learner",
      email: "testlearner@gmail.com",
      password: "Password@123",
      accountType: ACCOUNT_TYPES.LEARNER,
      languages: [LANGUAGES.ENGLISH],
    };


    try {

      await axios.post(
        REGISTER_URL,
        userData
      );

    } catch (error) {

      expect(error.response.status).toBe(400);

    }

  });


  test("should reject registration with invalid password", async () => {

    expect.assertions(1);


    const userData = {
      fullname: "Test Learner",
      username: "testlearner",
      email: "testlearner@gmail.com",
      password: "weakpassword",
      accountType: ACCOUNT_TYPES.LEARNER,
      languages: [LANGUAGES.ENGLISH],
    };


    try {

      await axios.post(
        REGISTER_URL,
        userData
      );

    } catch (error) {

      expect(error.response.status).toBe(400);

    }

  });


  test("should reject learner when teaching fields are provided", async () => {

    expect.assertions(1);


    const userData = {
      fullname: "Test Learner",
      username: "testlearner",
      email: "testlearner@gmail.com",
      password: "Password@123",
      accountType: ACCOUNT_TYPES.LEARNER,
      languages: [LANGUAGES.ENGLISH],

      teachingSkills: [],
      teachingStyles: [],
    };


    try {

      await axios.post(
        REGISTER_URL,
        userData
      );

    } catch (error) {

      expect(error.response.status).toBe(400);

    }

  });


  test("should reject duplicate email", async () => {

    expect.assertions(1);


    await createTestLearner();


    const userData = {
      fullname: "Test Teacher",
      username: "testteacher",

      // same email as existing learner
      email: "testlearner@gmail.com",

      password: "Password@123",
      accountType: ACCOUNT_TYPES.LEARNER,
      languages: [LANGUAGES.ENGLISH],
    };


    try {

      await axios.post(
        REGISTER_URL,
        userData
      );

    } catch (error) {

      expect(error.response.status).toBe(409);

    }

  });


  test("should reject duplicate username", async () => {

    expect.assertions(1);


    await createTestLearner();


    const userData = {
      fullname: "Test Teacher",

      // same username as existing learner
      username: "testlearner",

      email: "testteacher@gmail.com",

      password: "Password@123",
      accountType: ACCOUNT_TYPES.LEARNER,
      languages: [LANGUAGES.ENGLISH],
    };


    try {

      await axios.post(
        REGISTER_URL,
        userData
      );

    } catch (error) {

      expect(error.response.status).toBe(409);

    }

  });

});
