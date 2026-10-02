import express from "express"
import cookieparser from "cookie-parser"
import cors from "cors"
import { errorHandler } from "./middlewares/error.middleware.js"
const app = express()

app.use(cors(
    {
        origin : process.env.CORS_ORIGIN,
        credentials : true
    }))
app.use(express.json({limit : "16kb"}))
app.use(express.urlencoded({extended : true ,limit : "16kb"}))
app.use(cookieparser())

//routes



//not found middleware


//errhandler
app.use(errorHandler)

export default app
