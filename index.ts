import { initServer } from "./server"
import { getStatsData, sendStatsData } from "./controllers/gameData"
import { STATS } from "./consts/routes"
import { Server } from "./interfaces/serverInterface"
const app: Server = initServer()

app.get(STATS, getStatsData)
app.post(STATS, sendStatsData)



