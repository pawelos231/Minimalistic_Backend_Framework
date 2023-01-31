import { initServer } from "./server"
import { getStatsData } from "./controllers/gameData"
import { GET_STATS } from "./consts/routes"
const app = initServer()

app.get(GET_STATS, getStatsData)




