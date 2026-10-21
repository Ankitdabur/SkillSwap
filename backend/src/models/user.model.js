import mongoose from "mongoose";
import bcrypt from "bcrypt";
import {
  USER_ROLES,
  ACCOUNT_TYPES,
  TEACHING_STYLES,
  LANGUAGES,
} from "../constants/enums.js";

const fullnamePattern = /^[\p{L} '-]+$/u;
const usernamePattern = /^[a-z0-9_]{3,30}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordPattern = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[^A-Za-z0-9\s]).{8,}$/;

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: usernamePattern,
    },

    fullname: {
      type: String,
      required: true,
      trim: true,
      match: fullnamePattern,
    },

    avatar: {
      type: String,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: emailPattern,
    },

    password: {
      type: String,
      required: true,
      select: false,
      match: passwordPattern,
    },

    refreshTokenHash: {
      type: String,
      default: null,
      select: false,
    },

    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.USER,
      required: true,
    },

    accountType: {
      type: String,
      enum: Object.values(ACCOUNT_TYPES),
      required: true,
    },

    languages: {
      type: [
        {
          type: String,
          enum: Object.values(LANGUAGES),
        },
      ],
      validate: {
        validator: (languages) => languages.length > 0,
        message: "atleast one language is required",
      },
    },

    teachingSkills: {
      type: [
          {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Skill",
          },
      ],
          validate: {
              validator: function (skills) {

                  if (
                      this.accountType === "TEACHER" ||
                      this.accountType === "TEACHER_LEARNER"
                  ) {
                      return skills.length > 0
                  }

                  if (this.accountType === "LEARNER") {
                      return skills.length === 0
                  }

                  return false
              },
              message: "Teaching skills are invalid for this account type",
          },
    },

    teachingStyles: {
    type: [
        {
            type: String,
            enum: Object.values(TEACHING_STYLES),
        },
    ],
    validate: {
        validator: function (styles) {

            if (
                this.accountType === ACCOUNT_TYPES.TEACHER ||
                this.accountType === ACCOUNT_TYPES.TEACHER_LEARNER
            ) {
                return Array.isArray(styles) && styles.length > 0
            }

            if (this.accountType === ACCOUNT_TYPES.LEARNER) {
                return Array.isArray(styles) && styles.length === 0
            }

            return false
        },
        message: "Teaching styles are invalid for this account type",
    },
    },

    rating: {
      type: Number,
      default: 0,
      required: true,
      min: 0,
      max: 5,
    },

    totalReviews: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    connections: {
      type: Number,
      default: 0,
      required: true,
      min: 0,
    },

    credits: {
      type: Number,
      default: 0,
      required: true,
      min: 0,
    },

    reservedCredits: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({
  accountType: 1,
  teachingSkills: 1,
});

userSchema.index({
  teachingStyles: 1,
});

userSchema.index({
  languages: 1,
});



userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  } else {
    this.password = await bcrypt.hash(this.password, 10);
  }
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
