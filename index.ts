import { initServer } from "./server"
import { getStatsData, sendStatsData } from "./controllers/gameData"
import { GET_STATS, POST_STATS } from "./consts/routes"
import { Server } from "./interfaces/serverInterface"
import http from 'http'
import fs from "fs"
const app: Server<Function & any> = initServer()
const auth = (req: any, res: http.ServerResponse) => {
    req.chuj = { "nie": 1 }
    console.log("WITAM Z AUTH MIDDLEWARE")
}
const auth2 = () => {
    console.log(2)
}

app.get(GET_STATS, getStatsData, [auth, auth2])
app.post(POST_STATS, sendStatsData)

app.get("/", async (req: any, res: http.ServerResponse) => {
    const file = fs.readFileSync("./index.html", {
        encoding: "utf-8"
    })
    res.write(file)
    res.end()
}, [[]])


