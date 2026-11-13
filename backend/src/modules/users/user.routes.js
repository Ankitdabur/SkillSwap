import {Router} from "express"
import { verifyJWT } from "../../middlewares/auth.middleware.js";
import { checkAccountStatus } from "../../middlewares/accountStatus.middleware.js";
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

// Get the currently logged-in user
router.get("/me" , verifyJWT , checkAccountStatus , getCurrentUser);
// Update the current user's basic profile
router.patch("/me/update" , verifyJWT , checkAccountStatus , upload.single("avatar") , validateUpdateProfile , updateProfile)
// Upgrade the current user's account type
router.patch("/me/account-upgrade", verifyJWT , checkAccountStatus , validateAccountUpgrade , upgradeAccount,);
// Update the current user's teaching profile
router.patch("/me/update/teaching-profile", verifyJWT, checkAccountStatus, validateUpdateTeachingProfile , updateTeachingProfile);
// Get another user's public profile
router.get("/:userId", verifyJWT ,checkAccountStatus ,validateUserIdParam ,getUserProfile);
// Change the current user's password
router.patch("/change-password" , verifyJWT , checkAccountStatus , validateChangePassword , changePassword )



export default router
