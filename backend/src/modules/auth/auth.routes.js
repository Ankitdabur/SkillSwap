import { Router } from "express";
import { validateRegister , validateLogin} from "./auth.validation.js";
import multer from "multer";
import upload from "../../middlewares/multer.middleware.js";
import {verifyJWT} from "../../middlewares/auth.middleware.js"
import { 
  registerUser , 
  loginUser , 
  refreshAccessToken , 
  logoutUser , 
}  from "./auth.controller.js";



const router = Router()



// Register a new user account
router.post("/register", upload.single("avatar") , validateRegister , registerUser);
// Log in a user and issue authentication tokens
router.post("/login" , validateLogin , loginUser)
// Issue a new access token using a refresh token
router.post("/refresh" , refreshAccessToken)
//secured routes
// Log out the current user and invalidate the refresh token
router.post("/logout" , verifyJWT , logoutUser)



export default router
