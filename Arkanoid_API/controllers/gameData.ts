import http from 'http'
import fs from 'fs'
import path from 'path'
import { levelTransform } from '../helpers/LevelTransform'
import { Response } from '../../interfaces/wrappers'
import { Level } from '../interfaces/levelInterface'

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


export const sendLevelData = async (req: any, res: Response) => {
    const body: Level = JSON.parse(req.body);


    if(Boolean(path.extname(body.levelName))) {
        body.levelName = body.levelName.replace(path.extname(body.levelName), "")
    }

    const directoryPath = path.resolve('./Arkanoid_API/levele');
    const filePath = path.join(directoryPath, body.levelName + ".txt");
    console.log(filePath);
  
    // Create the directory if it doesn't exist
    if (!fs.existsSync(directoryPath)) {
      try {
        fs.mkdirSync(directoryPath, { recursive: true });
        console.log('Directory created successfully');
      } catch (error) {
        console.error('Error creating directory:', error);
        return res.end({ error: 'Failed to create directory' });
      }
    }
  

    const exists = fs.existsSync(filePath)
    
    if(exists){
        console.warn("exists")
        return res.end(JSON.stringify("level with this name already exists")) 
    }

    // Write the file
    try {
      fs.readdir(directoryPath, (error, files) => {

        if (error) {
            console.error('Error reading directory:', error);
            return
        }

        fs.writeFileSync(filePath, JSON.stringify(body));
      })
    
      
    } catch (error) {
      console.error('Error creating file:', error);
      return res.end({ error: 'Failed to create file' });
    }

  
    res.end(JSON.stringify("File created successfully"))
   
  };
  