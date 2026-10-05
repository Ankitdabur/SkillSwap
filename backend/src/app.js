import express from "express"
import cookieparser from "cookie-parser"
import cors from "cors"
import { errorHandler } from "./middlewares/error.middleware.js"
import { notFound } from "./middlewares/notFound.middleware.js"
import authRouter from "./modules/auth/auth.routes.js"

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
app.use("/api/v1/auth" , authRouter)


//not found middleware
app.use(notFound)

//errhandler
app.use(errorHandler)

export default app
