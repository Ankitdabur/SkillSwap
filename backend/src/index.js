import app from "./app.js"
import { dbconnect } from "./db/index.js"
import {validateEnvironment} from "./utils/validateEnvironment.js"
import cron from "node-cron";




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






// const task = cron.schedule("*/2 * * * * *", () => {
//   console.log("Task running:", new Date().toLocaleTimeString());
// });

// console.log("Initial status:", task.getStatus());

// // After 7 seconds, stop scheduling
// setTimeout(() => {
//   task.stop();
//   console.log("Task stopped:", task.getStatus());
// }, 7000);

// // After 13 seconds, resume scheduling
// setTimeout(() => {
//   task.start();
//   console.log("Task resumed:", task.getStatus());
// }, 13000);

// // After 20 seconds, destroy the task
// setTimeout(() => {
//   task.destroy();
//   console.log("Task destroyed:", task.getStatus());
// }, 20000);

// setTimeout(() => {
//   task.start();
//   console.log("Task resumed:", task.getStatus());
// }, 21000);


// const task = cron.createTask("*/60 * * * * *", () => {
//   console.log("Hello");
// });

// console.log(task.getStatus()); // "stopped"
// console.log(cron.validate("70 * * * * *"))
// task.start();