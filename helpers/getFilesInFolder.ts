import fs from 'fs'
import path from 'path'
import { CheckIfExistsInType } from './TypeCheck';
import { imageTypesArray } from '../constants/StaticFileTypes'

export function getFilesInFolder(folderPath: string): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
      fs.readdir(folderPath, (err, files) => {
        if (err) {
          reject(err);
        } else {
          resolve(files);
        }
      });
    });
  }


  export const areFilesInFolderImages = async (folderPath: string) => {
    const stats = fs.statSync(folderPath);
    
    if(!stats.isDirectory()){
        console.log("path is not a folder")
        return false 
    }
    const files = await getFilesInFolder(folderPath)

    for(const value of files){
        const extenstion = path.extname(value).slice(1)
        const isImage = CheckIfExistsInType(extenstion, imageTypesArray)
        if(!isImage){
            return false
        }
    }
    return true
  }