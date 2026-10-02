import mongoose from "mongoose";
import bcrypt from "bcrypt";
import {
  USER_ROLES,
  ACCOUNT_TYPES,
  TEACHING_STYLES,
  LANGUAGES,
} from "../constants/enums.js";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    fullname: {
      type: String,
      required: true,
      trim: true,
    },

    avatar: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
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
            this.accountType == "TEACHER" ||
            this.accountType == "TEACHER_LEARNER"
          ) {
            return skills.length > 0;
          }
          return true;
        },
        message: "atleast one teaching skill is required!!",
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
            this.accountType == "TEACHER" ||
            this.accountType == "TEACHER_LEARNER"
          ) {
            return styles.length > 0;
          }
          return true;
        },
        message: "At least one teaching style is required",
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