import { initServer } from "./server"
import { getStatsData, sendStatsData } from "./controllers/gameData"
import { GET_STATS, POST_STATS } from "./consts/routes"
import { Server } from "./interfaces/serverInterface"
import http from 'http'
import fs from "fs"

const app: Server<Function & any> = initServer()
const auth2 = (req: any, res: http.ServerResponse) => {
    req.example = "example"
    console.log(2)
}
app.get(GET_STATS, getStatsData, [auth2])


const auth = (req: any, res: http.ServerResponse) => {
    req.chuj = { "nie": 1 }
    console.log("WITAM Z AUTH MIDDLEWARE")
}
app.post(POST_STATS, sendStatsData)

app.get("/", async (req: any, res: http.ServerResponse) => {
    const file = fs.readFileSync("./index.html", {
        encoding: "utf-8"
    })
    res.write(file)
    res.end()
})


