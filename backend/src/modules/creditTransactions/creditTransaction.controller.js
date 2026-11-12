
import asyncHandler from "../../utils/asyncHandler.js"
import ApiResponse from "../../utils/ApiResponse.js"
import { getMyCreditTransactionsService } from "./creditTransaction.service.js"


const getMyCreditTransactions = asyncHandler(async (req, res) => {

    const {
        cursor,
        limit
    } = req.creditTransactionPagination

    const creditTransactionData = await getMyCreditTransactionsService(
        req.user._id,
        cursor,
        limit
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            creditTransactionData,
            "CreditTransactions fetched successfully"
        )
    )
})


export {getMyCreditTransactions}
