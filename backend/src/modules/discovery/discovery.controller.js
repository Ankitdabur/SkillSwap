
import asyncHandler from "../../utils/asyncHandler.js"
import ApiResponse from "../../utils/ApiResponse.js"
import { discoverTeachersService } from "./discovery.service.js"


const discoverTeachers = asyncHandler(async (req, res) => {

    const teachersData = await discoverTeachersService(
        req.user._id,
        req.discoveryQuery
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            teachersData,
            "Teachers discovered successfully"
        )
    )
})


export {
    discoverTeachers
}
