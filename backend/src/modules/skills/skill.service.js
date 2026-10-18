import Skill from "../../models/skill.model.js"
import { SKILL_CATEGORIES } from "../../constants/enums.js"
import ApiError from "../../utils/ApiError.js"
import { ERROR_CODES } from "../../constants/errorCodes.js"
import mongoose from "mongoose"

const getSkillCategoriesService = () => {

    const categories = Object.values(SKILL_CATEGORIES)

    return {categories}

}

const getAllSkillsService = async () => {

    const groupedSkills = await Skill.aggregate([
        {
            $sort : {
                category : 1,
                displayName :1
            }
        },
        {
            $group : {
                _id : "$category",
                skills : {
                    $push : {
                        _id : "$_id",
                        displayName : "$displayName",
                        description : "$description"
                    }
                }
            }
        },
        {    
            $project : {
                _id : 0,
                skills : 1,
                category : "$_id"
            }  
        } 
        
    ])

    return {groupedSkills}
}


const getSkillByIdService = async (skillId) => {

    const skill = await Skill.findById(skillId)

    if(!skill){
        throw new ApiError(
            404,
            "Skill not found",
            ERROR_CODES.RESOURCE_NOT_FOUND
        )
    }

    return {skill}
}

const createSkillService = async (skillData) => {

    const {name,
        displayName,
        category,
        description
    }  = skillData

    const existingSkill = await Skill.findOne({name})

    if(existingSkill){
    throw new ApiError(
        409,
        "Skill already exists",
        ERROR_CODES.RESOURCE_ALREADY_EXISTS
    )}

    const createdSkill = await Skill.create({
        name,
        displayName,
        category,
        description
    })


    return {createdSkill}

}

const updateSkillService = async (skillId , skillData) => {

    const {
        name,
        displayName,
        category,
        description
    } = skillData


    const existingSkill = await Skill.findOne({
    name,
    _id: {
        $ne: skillId
    }
    })

    if(existingSkill){
        throw new ApiError(
            409,
            "Skill already exists",
            ERROR_CODES.RESOURCE_ALREADY_EXISTS
        )
    }


// can do this
//    const result = await Skill.updateOne(
//     {
//         _id : skillId
//     },
//     {
//         // also work without using set
//         $set : {
//             name,
//             displayName,
//             category,
//             description
//         }
//     },
//     {
//         runValidators : true
//     })

//     const updatedSkill = await Skill.findById(skillId)

//     return {updatedSkill}

   const updatedSkill = await Skill.findByIdAndUpdate(
    skillId,
    {
        name,
        displayName,
        description,
        category
    },
    {
        new : true,
        runValidators : true
    }
   )

   if(!updatedSkill){
    throw new ApiError(
        404,
        "Skill not found",
        ERROR_CODES.RESOURCE_NOT_FOUND
    )
}

   return {updatedSkill}

}

export {
    getSkillCategoriesService,
    getAllSkillsService,
    getSkillByIdService,
    createSkillService,
    updateSkillService
}
