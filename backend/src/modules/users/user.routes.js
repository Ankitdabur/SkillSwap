import {Router} from "express"
import { verifyJWT } from "../../middlewares/auth.middleware.js";
import {validateAccountUpgrade , validateUserIdParam , validateUpdateProfile , validateUpdateTeachingProfile , validateChangePassword} from "../users/user.validation.js"
import upload from "../../middlewares/multer.middleware.js";
import {
    upgradeAccount , 
    getUserProfile , 
    updateProfile ,
    getCurrentUser , 
    updateTeachingProfile , 
    changePassword} from "./user.controller.js"




const router = Router()

//return logged in user
router.get("/me" , verifyJWT , getCurrentUser);
//update only fullname , avatar , languages
router.patch("/me/update" , verifyJWT , upload.single("avatar") , validateUpdateProfile , updateProfile)
//upgrate teacher and learner accounts only
router.patch("/me/account-upgrade", verifyJWT , validateAccountUpgrade , upgradeAccount,);
//get info of any user 
router.get("/:userId", verifyJWT ,validateUserIdParam ,getUserProfile);
//update the teaching fields only
router.patch("/me/update/teaching-profile", verifyJWT, validateUpdateTeachingProfile , updateTeachingProfile);
//change current password
router.patch("/change-password" , verifyJWT , validateChangePassword , changePassword )



export default router
