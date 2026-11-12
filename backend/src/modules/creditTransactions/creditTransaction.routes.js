import { Router } from "express"
import { verifyJWT } from "../../middlewares/auth.middleware.js"
import { getMyCreditTransactions } from "./creditTransaction.controller.js"
import { validateGetCreditTransactions } from "./creditTransaction.validation.js"


const router = Router()


// Get the logged-in user's CreditTransaction history with cursor pagination
router.get("/me", verifyJWT, validateGetCreditTransactions, getMyCreditTransactions)


export default router
