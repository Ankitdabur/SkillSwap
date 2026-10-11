import { Router } from "express";
import { validateRegister , validateLogin} from "./auth.validation.js";
import { registerUser , loginUser } from "./auth.controller.js";
import multer from "multer";
import upload from "../../middlewares/multer.middleware.js";




const router = Router()

router.post(
  "/register",
  upload.single("avatar"),
  validateRegister,
  registerUser,
);
router.post("/login" , validateLogin , loginUser)

export default router