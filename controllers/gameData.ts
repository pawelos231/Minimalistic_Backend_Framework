import http from 'http'
import fs from 'fs'
import { levelTransform } from '../helpers/LevelTransform'
import { Response } from '../interfaces/wrappers'

export const getStatsData = (req: http.IncomingMessage, res: Response) => {
    const temporary: string = JSON.stringify(["siema", "siema1"])
    res.write(temporary)
    res.end()
}

export const sendStatsData = (req: any, res: Response) => {
    res.write(JSON.stringify(req.body))
    res.end()
}

export const getLevelData = async (req: any, res: Response) => {
    levelTransform()
    const file: string = fs.readFileSync("./data/formattedLevels.txt", {
        encoding: "utf-8"
    })
    res.write(JSON.stringify(file))
    res.end()
}
