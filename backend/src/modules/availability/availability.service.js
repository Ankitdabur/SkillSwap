import Availability from "../../models/availability.model.js"
import mongoose from "mongoose"
import ApiError from "../../utils/ApiError.js"
import { ERROR_CODES } from "../../constants/errorCodes.js"


const getCurrentUserAvailabilityService = async (userId) => {

    const availability = await Availability.find({userId})

    return {availability}

}

const updateCurrentUserAvailabilityService = async (userId , Userdata) => {

   const {availability} = Userdata

   const session = await mongoose.startSession()

   let slots = []
 
    try{

        await session.withTransaction(async () => {
            await Availability.deleteMany({userId} , {session})

            const availabilityData = availability.map( (slot) => ( {
                userId : userId,
                startTime : slot.startTime,
                endTime : slot.endTime,
                day : slot.day
            } ))

            slots = await Availability.create(availabilityData , {session ,  ordered: true})
        })

    }catch(error){

        if (error?.code === 11000) {
        throw new ApiError(
            409,
            "Duplicate availability slot",
            ERROR_CODES.INVALID_FIELD_VALUE
        )
    }

        throw error

    } finally{
        await session.endSession()
    }
    

    return {availability : slots}
}




export {
    getCurrentUserAvailabilityService,
    updateCurrentUserAvailabilityService
}