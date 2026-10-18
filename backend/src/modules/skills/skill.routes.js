import {Router} from "express"
import {verifyJWT} from "../../middlewares/auth.middleware.js"
import {adminRoleMiddleware} from "../../middlewares/role.middleware.js"
import {
    getSkillCategories,
    getAllSkills,
    getSkillById,
    createSkill,
    updateSkill
} from "./skill.controller.js"
import { 
    validateSkillId ,
    validateCreateSkill,
} from "./skill.validation.js"




const router = Router()

router.get("/" , getAllSkills)
router.get("/categories" , getSkillCategories)
router.get("/:skillId" , validateSkillId , getSkillById)
router.post("/" , verifyJWT , adminRoleMiddleware , validateCreateSkill , createSkill)
router.put("/:skillId" , verifyJWT , adminRoleMiddleware , validateSkillId , validateCreateSkill , updateSkill)

export default router
