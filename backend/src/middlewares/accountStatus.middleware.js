import asyncHandler from "../utils/asyncHandler.js"
import { checkUserAccountStatus } from "../modules/users/accountStatus.service.js"


const checkAccountStatus = asyncHandler(async (req, _res, next) => {

    req.user = await checkUserAccountStatus(req.user)

    next()
})


export {checkAccountStatus}
