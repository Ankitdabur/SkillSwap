import app from "./app.js";
import {dbconnect} from "./db/index.js";

dbconnect()
.then( () => {
    app.listen(process.env.PORT || 3000 , () => {
        console.log(`server is listening at port : ${process.env.PORT}`)
    })
})
.catch((error) => {
   console.log("db error",error)
})