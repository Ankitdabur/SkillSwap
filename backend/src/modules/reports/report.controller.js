import asyncHandler from "../../utils/asyncHandler.js"
import ApiResponse from "../../utils/ApiResponse.js"
import {
    createReportService,
    getMyReportsService
} from "./report.service.js"


const createReport = asyncHandler(async (req, res) => {

    const reportData = await createReportService(
        req.user._id,
        req.reportData
    )

    return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            reportData,
            "Report created successfully"
        )
    )
})


const getMyReports = asyncHandler(async (req, res) => {

    const reportsData = await getMyReportsService(
        req.user._id,
        req.reportPagination.cursor,
        req.reportPagination.limit
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            reportsData,
            "Reports fetched successfully"
        )
    )
})


export {
    createReport,
    getMyReports
}
