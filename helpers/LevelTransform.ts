import fs from 'fs'
import {Transform} from 'stream'
import {pipeline} from 'stream/promises'
import { LevelData } from '../interfaces/levelInterface'

export const levelTransform = async (): Promise<void> => {
    const TransformText: Transform = new Transform({
        objectMode: true,
        transform(chunk: string, enc: BufferEncoding, callback){
            const transformedData: LevelData[] = chunk.split(/\r?\n/).map((item: string) => item.split(",")).map((item: string[]) => {
                const tempObj: any = {}
                item.forEach((item: string) => {
                    const splittedArrat: string[] = item.trim().split(":")
                    tempObj[String(splittedArrat[0])] = Number(splittedArrat[1].trim())
                })
                return tempObj as LevelData
            })
            callback(null, JSON.stringify(transformedData))
        },
    })
    try{
        await pipeline(
            fs.createReadStream("./data/levele.txt", {
                encoding: "utf-8"
            }),
            TransformText,
            fs.createWriteStream("./data/formattedLevels.txt")
        ) 
    }  catch(err){
        console.log("WYJEBAŁO ERRROR")
    }
}