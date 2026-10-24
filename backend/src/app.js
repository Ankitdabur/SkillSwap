import express from "express"
import cookieparser from "cookie-parser"
import cors from "cors"
import { errorHandler } from "./middlewares/error.middleware.js"
import { notFound } from "./middlewares/notFound.middleware.js"
import authRouter from "./modules/auth/auth.routes.js"
import userRouter from "./modules/users/user.routes.js"
import availabilityRouter from "./modules/availability/availability.routes.js"
import skillRouter from "./modules/skills/skill.routes.js"
import skillRequestRouter from "./modules/skillRequests/skillRequest.routes.js"
import discoveryRouter from "./modules/discovery/discovery.routes.js"
import matchRouter from "./modules/matches/match.routes.js"
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
app.use("/api/v1/user" , userRouter)
app.use("/api/v1/availability" , availabilityRouter )
app.use("/api/v1/skills", skillRouter)
app.use("/api/v1/skill-requests", skillRequestRouter)
app.use("/api/v1/discovery", discoveryRouter)
app.use("/api/v1/matches" , matchRouter)
//not found middleware
app.use(notFound)

//errhandler
app.use(errorHandler)

export default app
