import http from 'http'
import fs from "fs"
import { Server } from "./server"
import { getStatsData, sendStatsData, getLevelData, sendLevelData} from "./Arkanoid_API/controllers/gameData"
import { GET_STATS, POST_STATS, GET_LEVELS, GET_EDITOR_LEVELS } from "./Arkanoid_API/constants/routes"
import { AllowCors } from "./middleware/cors"


const app: Server = new Server()

app.use((req: any, res: http.ServerResponse, next: Function) => {
    AllowCors(res)
    next()
  });

const auth2 = (req: any, res: http.ServerResponse): void => {
    req.example = "example"
}

app.get(GET_STATS, getStatsData, [auth2])
app.get(GET_LEVELS, getLevelData)
app.post(POST_STATS, sendStatsData)
app.post(GET_EDITOR_LEVELS, sendLevelData)


app.get("/nie", (req: any, res: http.ServerResponse) => {
    const file = fs.readFileSync("./views/index.html", {
        encoding: "utf-8"
    })
    res.write(file)
    res.end()
})




