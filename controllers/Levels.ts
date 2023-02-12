import http from 'http'
import fs from 'fs'
import {Transform} from 'stream'
import {pipeline} from 'stream/promises'
import { LevelData } from '../interfaces/levelInterface'
export const getLevelData = async (req: http.IncomingMessage, res: http.ServerResponse<http.IncomingMessage>) => {

    let data: LevelData[][] = []
    const TransformText: Transform = new Transform({
        objectMode: true,
        transform(chunk: string, enc: BufferEncoding, callback){
            const transformedData: LevelData[] = chunk.split(/\r?\n/).map((item: string) => item.split(",")).map(item => {
                const tempObj: any = {}
                item.forEach((item: string) => {
                    const splittedArrat: string[] = item.trim().split(":")
                    tempObj[String(splittedArrat[0])] = Number(splittedArrat[1].trim())
                })
                return tempObj
            })
            data.push(transformedData)
            callback(null, transformedData)
        },
    })
    try {
        await pipeline(
            fs.createReadStream("./data/levele.txt", {
                encoding: "utf-8"
            }),
            TransformText
        )
    } catch(error){
        console.log(error)
    }
    console.log(JSON.stringify(data.flat()))
    res.write(JSON.stringify(data.flat()))
    res.end()
}
