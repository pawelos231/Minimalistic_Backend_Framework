import http from 'http'
import fs from 'fs'
import { levelTransform } from '../helpers/LevelTransform'

export const getStatsData = (req: http.IncomingMessage, res: http.ServerResponse<http.IncomingMessage>) => {
    const temporary: string = JSON.stringify(["siema", "siema1"])
    console.log("siema")
    res.write(temporary)
    res.end()
}

export const sendStatsData = (req: any, res: http.ServerResponse<http.IncomingMessage>) => {
    res.write(JSON.stringify(req.body))
    res.end()
}

export const getLevelData = async (req: any, res: http.ServerResponse<http.IncomingMessage>) => {
    levelTransform()
    const file = fs.readFileSync("./data/formattedLevels.txt", {
        encoding: "utf-8"
    })
    res.write(JSON.stringify(file))
    res.end()
}
