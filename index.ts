import { initServer } from "./server"
import { getStatsData, sendStatsData } from "./controllers/gameData"
import { STATS } from "./consts/routes"
import { Server } from "./interfaces/serverInterface"
const app: Server = initServer()

const auth = () => {
    console.log(1)
}
const auth2 = () => {
    console.log(2)
}

app.get(STATS, getStatsData, [auth, auth2])
app.post(STATS, sendStatsData)



