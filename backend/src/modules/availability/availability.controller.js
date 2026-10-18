import asyncHandler from "../../utils/asyncHandler.js"
import ApiResponse from "../../utils/ApiResponse.js"
import {
    getCurrentUserAvailabilityService,
    updateCurrentUserAvailabilityService
}  from "./availability.service.js"


const getCurrentUserAvailability = asyncHandler( async (req , res) => {
    const userId = req.user._id

   const availability = await getCurrentUserAvailabilityService(userId)

   return res
   .status(200)
   .json( 
    new ApiResponse (
        200,
        availability,
        "current user availability fetched successfully"
    ))
})

const updateCurrentUserAvailability = asyncHandler ( async ( req , res) => {

    const userId = req.user._id

    const updatedAvailability = await updateCurrentUserAvailabilityService(userId , req.body)

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updatedAvailability,
            "user availability updated successfully"
        )
    )
} ) 

export {
    getCurrentUserAvailability,
    updateCurrentUserAvailability
}