import asyncHandler from "../../utils/asyncHandler.js"
import ApiResponse from "../../utils/ApiResponse.js"
import {
    getSkillCategoriesService,
    getAllSkillsService,
    getSkillByIdService,
    createSkillService,
    updateSkillService
} from "./skill.service.js"



//created because we want ki jb admin new skilll add kre toh usse categories ke options dikhaye jaaye jo hai...manually type na krna pde
const getSkillCategories = asyncHandler ( async (_req, res) => {

    const categoriesData = getSkillCategoriesService()

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            categoriesData,
            "Skill categories fetched successfully"
        )
    )

})


const getAllSkills = asyncHandler ( async (req, res) => {

    const groupedSkillsData = await getAllSkillsService()

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            groupedSkillsData,
            "All predefined skills fetched successfully"
        )
    )

})


const getSkillById = asyncHandler ( async (req, res) => {

    const {skillId} = req.params

    const skillData = await getSkillByIdService(skillId)

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            skillData,
            "Skill fetched successfully"
        )
    )

})

const createSkill = asyncHandler( async ( req , res )=> {

    const newlyCreatedSkill = await createSkillService(req.body)

    return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            newlyCreatedSkill,
            "new skill created successfully"
        )
    )
})

const updateSkill = asyncHandler ( async (req, res) => {

    const {skillId} = req.params

    const updatedSkill = await updateSkillService(skillId, req.body)

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updatedSkill,
            "skill updated successfully"
        )
    )
})





export {
    getSkillCategories,
    getAllSkills,
    getSkillById,
    createSkill,
    updateSkill

}
