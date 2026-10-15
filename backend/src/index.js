import app from "./app.js"
import { dbconnect } from "./db/index.js"
import {validateEnvironment} from "./utils/validateEnvironment.js"


const startServer = async () => {

    try {

        validateEnvironment()

        await dbconnect()

        app.listen(
            process.env.PORT || 3000,
            () => {
                console.log(
                    `Server is listening at port: ${process.env.PORT || 3000}`
                )
            }
        )

    } catch (error) {

        console.error(
            "Application startup failed:",
            error.message
        )

        process.exit(1)

    }

}


startServer()
