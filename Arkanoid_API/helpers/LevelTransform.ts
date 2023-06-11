import fs from 'fs'
import path from 'path'
import { Transform } from 'stream'
import { pipeline } from 'stream/promises'
import { Level } from '../interfaces/levelInterface'

export const levelTransform = async (): Promise<void> => {

    const TransformText: Transform = new Transform({
        objectMode: true,
        transform(chunk: string, enc: BufferEncoding, callback) {
            const transformedData: Level[] = chunk.split(/\r?\n/)
            .map((item: string) => item.split(","))
            ?.map((item: string[]) => {
              const tempObj: any = {};
              item.forEach((item: string) => {
                const splittedArrat: string[] = (item?.trim() ?? "").split(":");
                tempObj[String(splittedArrat[0])] = Number(splittedArrat[1]?.trim() ?? 0);
              });
              return tempObj as Level;
            });
          
            callback(null, JSON.stringify(transformedData))
        },
    })

    const deleteUselessData: Transform = new Transform({
      objectMode: true, transform(chunk: string, end: BufferEncoding, callback) {
        const transformed = JSON.parse(chunk) as Array<Level>
        const cutOut = transformed.slice(0, transformed.length - 2)
        callback(null, JSON.stringify(cutOut))
      }
    })

    try {
        await pipeline(
            fs.createReadStream (path.resolve('./Arkanoid_API/data/levele.txt')
            , {
                encoding: "utf-8"
            }),
            TransformText,
            deleteUselessData,
            fs.createWriteStream(path.resolve('./Arkanoid_API/data/formattedLevels.txt'),)
        )
    } 
    catch (err) {
        console.log("wysypało error", err)
    }
}