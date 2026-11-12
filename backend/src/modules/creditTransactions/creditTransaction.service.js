
import CreditTransaction from "../../models/creditTransaction.model.js"
import ApiError from "../../utils/ApiError.js"
import { ERROR_CODES } from "../../constants/errorCodes.js"


const getMyCreditTransactionsService = async (
    loggedInUser,
    cursor,
    limit
) => {

    let cursorCreditTransaction = null

    if(cursor){
        cursorCreditTransaction = await CreditTransaction.findOne({
            _id: cursor,
            user: loggedInUser
        }).select("createdAt")

        if(!cursorCreditTransaction){
            throw new ApiError(
                400,
                "Invalid CreditTransaction cursor",
                ERROR_CODES.INVALID_FIELD_VALUE
            )
        }
    }

    const creditTransactionResults = await CreditTransaction.aggregate([
        {
            $match: {
                user: loggedInUser,
                ...(cursorCreditTransaction
                    ? {
                        $or: [
                            {
                                createdAt: {
                                    $lt: cursorCreditTransaction.createdAt
                                }
                            },
                            {
                                createdAt: cursorCreditTransaction.createdAt,
                                _id: {
                                    $lt: cursorCreditTransaction._id
                                }
                            }
                        ]
                    }
                    : {})
            }
        },
        {
            $sort: {
                createdAt: -1,
                _id: -1
            }
        },
        {
            $limit: limit + 1
        }
    ])

    const hasMore = creditTransactionResults.length > limit

    const creditTransactions = hasMore
        ? creditTransactionResults.slice(0, limit)
        : creditTransactionResults

    const nextCursor = hasMore
        ? creditTransactions[creditTransactions.length - 1]._id.toString()
        : null

    return {
        creditTransactions,
        pagination: {
            limit,
            nextCursor,
            hasMore
        }
    }
}


export {getMyCreditTransactionsService}
