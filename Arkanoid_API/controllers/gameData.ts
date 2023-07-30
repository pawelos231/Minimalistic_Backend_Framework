import http from "http";
import fs from "fs";
import path from "path";
import { levelTransform } from "../helpers/LevelTransform";
import { Response } from "../../interfaces/wrappers";
import { Level } from "../interfaces/levelInterface";
import { tempTabOfSongs } from "../data/Songs";
import { tempTabOfSounds } from "../data/Sounds";
import { tabOfBuffs } from "../data/Buffs";

export const getStatsData = (req: http.IncomingMessage, res: Response) => {
  const temporary: string = JSON.stringify(["siema", "siema1"]);
  res.write(temporary);
  res.end();
};

export const sendStatsData = (req: any, res: Response) => {
  res.write(JSON.stringify(req.body));
  res.end();
};

export const getLevelData = async (req: any, res: Response) => {
  levelTransform();
  const file: string = fs.readFileSync(
    "./Arkanoid_API/data/formattedLevels.txt",
    {
      encoding: "utf-8",
    }
  );
  console.log(file);
  return res.end(JSON.stringify(file));
};

export const sendLevelData = async (req: any, res: Response) => {
  const body: Level = JSON.parse(req.body);

  if (Boolean(path.extname(body.levelName))) {
    body.levelName = body.levelName.replace(path.extname(body.levelName), "");
  }

  const directoryPath = path.resolve("./Arkanoid_API/levele");
  const filePath = path.join(directoryPath, body.levelName + ".txt");
  console.log(filePath);

  // Create the directory if it doesn't exist
  if (!fs.existsSync(directoryPath)) {
    try {
      fs.mkdirSync(directoryPath, { recursive: true });
      console.log("Directory created successfully");
    } catch (error) {
      console.error("Error creating directory:", error);
      return res.end({ error: "Failed to create directory" });
    }
  }

  const exists = fs.existsSync(filePath);
  if (exists) return res.end({ error: "level with this name already exists" });

  // Write the file
  try {
    fs.readdir(directoryPath, (error, files) => {
      if (error) {
        console.error("Error reading directory:", error);
        return res.end({ error: "Error reading directory" });
      }

      fs.writeFileSync(filePath, JSON.stringify(body));
    });
  } catch (error) {
    console.error("Error creating file:", error);
    return res.end({ error: "Failed to create file" });
  }

  res.end(JSON.stringify("File created successfully"));
};

export const getLevels = async (req: Request, res: Response) => {
  const directoryPath = path.resolve("./Arkanoid_API/levele");

  try {
    const files = await fs.promises.readdir(directoryPath);

    const fileDataArray = await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(directoryPath, file);
        let chunks = "";

        const stream = fs.createReadStream(filePath);

        return new Promise<string>((resolve, reject) => {
          stream.on("data", (data) => {
            chunks += data;
          });

          stream.on("end", () => {
            resolve(JSON.parse(chunks));
          });

          stream.on("error", (err) => {
            reject(err);
          });
        });
      })
    );
    res.end(JSON.stringify(fileDataArray));
  } catch (error) {
    console.error("Error reading folder:", error);
    res.end(JSON.stringify({ error: "Internal Server Error" }));
  }
};

export const songsContr = (req: Request, res: Response) => {
  res.end(JSON.stringify(tempTabOfSongs));
};

export const soundContr = (req: Request, res: Response) => {
  res.end(JSON.stringify(tempTabOfSounds));
};
export const buffsContr = (req: Request, res: Response) => {
  res.end(JSON.stringify(tabOfBuffs));
};
