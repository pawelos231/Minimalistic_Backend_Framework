import { getStatsData } from "../controllers/gameData"
const routes = [{
    getStats: (req, res) => {
        getStatsData(req, res)
    }
}]