import { Router } from "express";
import { validateRegister } from "./auth.validation.js";
import { registerUser } from "./auth.controller.js";
import multer from "multer";
import upload from "../../middlewares/multer.middleware.js";




const router = Router()

router.post(
  "/register",
  upload.single("avatar"),
  validateRegister,
  registerUser,
);

export default router