import axios from "axios";
import mongoose from "mongoose";
import { dbconnect } from "../../../src/db/index.js";
import app from "../../../src/app.js";
import Availability from "../../../src/models/availability.model.js";
import {createTestLearner,} from "../../helpers/createTestUser.js";
import {
  cleanupTestUsers,
  cleanupTestAvailability,
} from "../../helpers/cleanupTestData.js";
import {
  ACCOUNT_TYPES,
  LANGUAGES,
  DAYS_OF_WEEK,
} from "../../../src/constants/enums.js";




const PORT = process.env.PORT || 3000;

const BACKEND_URL = `http://localhost:${process.env.PORT}`;

const REGISTER_URL = `${BACKEND_URL}/api/v1/auth/register`;


const validAvailability = [
  {
    day: DAYS_OF_WEEK.MONDAY,
    startTime: "10:00",
    endTime: "12:00",
  },
];


let server

describe("POST /api/v1/auth/register", () => {

  beforeAll(async () => {
      await dbconnect().then(() => {
       server = app.listen(PORT);
     });
  })
 
  afterEach(async () => {
    await cleanupTestAvailability();
    await cleanupTestUsers();
  });

  afterAll(async () => {
    await cleanupTestAvailability();
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
      availability: validAvailability,
    };


    const response = await axios.post(
      REGISTER_URL,
      userData
    );


    expect(response.status).toBe(201);

    expect(response.data.success).toBe(true);

    expect(response.data.data).toBeDefined();

    expect(response.data.data.user.username).toBe(
      userData.username
    );

    expect(response.data.data.user.email).toBe(
      userData.email
    );

    expect(response.data.data.user.accountType).toBe(
      ACCOUNT_TYPES.LEARNER
    );

    expect(
      response.data.data.user.password
    ).toBeUndefined();

    expect(
      response.data.data.user.refreshTokenHash
    ).toBeUndefined();

    expect(
      response.data.data.availability
    ).toHaveLength(validAvailability.length);

    expect(
      response.data.data.availability[0].userId
    ).toBe(response.data.data.user._id);
  });


  test("should create availability documents linked to the registered user", async () => {

    const userData = {
      fullname: "Test Learner",
      username: "testlearner",
      email: "testlearner@gmail.com",
      password: "Password@123",
      accountType: ACCOUNT_TYPES.LEARNER,
      languages: [LANGUAGES.ENGLISH],
      availability: [
        {
          day: DAYS_OF_WEEK.MONDAY,
          startTime: "10:00",
          endTime: "12:00",
        },
        {
          day: DAYS_OF_WEEK.TUESDAY,
          startTime: "14:00",
          endTime: "16:00",
        },
      ],
    };


    const response = await axios.post(
      REGISTER_URL,
      userData
    );


    const savedAvailability = await Availability.find({
      userId: response.data.data.user._id,
    });

    expect(savedAvailability).toHaveLength(
      userData.availability.length
    );

    savedAvailability.forEach((slot) => {
      expect(slot.userId.toString()).toBe(
        response.data.data.user._id
      );
    });
  });


  test("should reject registration when username is missing", async () => {

    expect.assertions(1);


    const userData = {
      fullname: "Test Learner",
      email: "testlearner@gmail.com",
      password: "Password@123",
      accountType: ACCOUNT_TYPES.LEARNER,
      languages: [LANGUAGES.ENGLISH],
      availability: validAvailability,
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
      availability: validAvailability,
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
      availability: validAvailability,

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
      availability: validAvailability,
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
      availability: validAvailability,
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
