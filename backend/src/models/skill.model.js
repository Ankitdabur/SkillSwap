import mongoose from "mongoose";

import { SKILL_CATEGORIES } from "../constants/enums.js";

const skillSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: Object.values(SKILL_CATEGORIES),
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

const Skill = mongoose.model("Skill", skillSchema);

export default Skill;
