import { Server } from "./server"
import { getStatsData, sendStatsData, getLevelData } from "./controllers/gameData"
import { GET_STATS, POST_STATS, GET_LEVELS } from "./constants/routes"
import { MethodsHandler } from "./interfaces/serverInterface"
import http from 'http'
import fs from "fs"

const ServerInstance: Server = new Server()
const app: MethodsHandler = ServerInstance.initServer()


const auth2 = (req: any, res: http.ServerResponse): void => {
    req.example = "example"
}
app.get(GET_STATS, getStatsData, [auth2])
app.get(GET_LEVELS, getLevelData)
app.post(POST_STATS, sendStatsData)

app.get("/nie", (req: any, res: http.ServerResponse) => {
    const file = fs.readFileSync("./views/index.html", {
        encoding: "utf-8"
    })
    res.write(file)
    res.end()
})


