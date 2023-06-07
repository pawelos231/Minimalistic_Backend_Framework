import fs from 'fs';
import { Transform } from 'stream';
import { pipeline } from 'stream'
import { Level } from '../interfaces/levelInterface';

export const levelTransform = async (): Promise<void> => {
  const TransformText: Transform = new Transform({
    objectMode: true,
    async transform(chunk: string, enc: BufferEncoding, callback) {
      try {
        const transformedData: Level[] = chunk
          .split(/\r?\n/)
          .map((item: string) => item.split(","))
          .map((item: string[]) => {
            const tempObj: Partial<Level> = {};
            item.forEach((item: string) => {
              const splittedArray: string[] = item.trim().split(":");
              tempObj[String(splittedArray[0])] = Number(splittedArray[1].trim());
            });
            return tempObj as Level;
          });
        callback(null, JSON.stringify(transformedData));
      } catch (err) {
        callback(err);
      }
    },
  });

  try {
    await pipeline(
      fs.createReadStream("./data/levele.txt", {
        encoding: "utf-8",
      }),
      TransformText,
      fs.createWriteStream("./data/formattedLevels.txt")
    );
  } catch (err) {
    console.log("Error occurred:", err);
  }
};
