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



router.post("/register", upload.single("avatar") , validateRegister , registerUser);
router.post("/login" , validateLogin , loginUser)
router.post("/refresh" , refreshAccessToken)

//secured routes
router.post("/logout" , verifyJWT , logoutUser)



export default router