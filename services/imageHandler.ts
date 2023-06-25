import fs from "fs";
import { promises as fsPromises, constants as fsConstants } from "fs";
import { promisify } from "util";
import path from "path";
import http from "http";
import sharp from "sharp";
import { Worker } from "worker_threads";

import { CheckIfExistsInType } from "../helpers/TypeCheck";
import { INCORRECT_FILE_TYPE } from "../constants/errorMessages";
import { FancyError } from "../exceptions/AugementedError";
import { InMemoryCache } from "../cache/inMemoryCache";
import { Options } from "../constants/serverOpts";
import { OK } from "../constants/responseHelpers";
import { ImageTypes, imageTypesArray } from "../constants/StaticFileTypes";
import { ImageResizeWorkerData } from "../interfaces/serverInterface";

type WorkerProps = {
  filePath: string;
  width: number;
  height: number;
  imageExtension: ImageTypes;
};

export class ImageHandler {
  private memoryCache: InMemoryCache;
  private options: { staticFileCacheTime: number };

  constructor(cacheInstance: InMemoryCache, options: Options) {
    this.memoryCache = cacheInstance;
    this.options = options;
  }

  private async resizeImage(
    filePath: string,
    width: number,
    height: number
  ): Promise<Buffer> {
    const image = sharp(filePath);
    const buffer = await image.resize(width, height).toBuffer();
    return buffer;
  }

  public async handleMultipleImages(
    res: http.ServerResponse,
    req: any,
    root: string
  ) {
    try {
      const folderPath = path.join(root, req.url);
      const filesPaths = await fsPromises.readdir(folderPath);

      if (filesPaths.length === 0) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        return res.end("No files found in the folder.");
      }

      const fileBuffers = await Promise.all(
        filesPaths.map(async (filePath: string) => {
          try {
            const absoluteFilePath = path.join(folderPath, filePath);
            const imageExtension = path.extname(filePath);

            const fileStats = await fsPromises.stat(absoluteFilePath);
            if (!fileStats.isFile()) {
              throw new FancyError("This folder contains non-file items.");
            }

            if (
              !CheckIfExistsInType(imageExtension.slice(1), imageTypesArray)
            ) {
              throw new FancyError("Incorrect file type encountered.");
            }

            const fileBuffer = await fsPromises.readFile(absoluteFilePath);
            return new Uint8Array(fileBuffer);
          } catch (error) {
            console.error(`Error while reading file '${filePath}':`, error);
            return null; // Skip the file that encountered an error
          }
        })
      );

      const validFileBuffers = fileBuffers.filter((buffer) => buffer !== null);

      if (validFileBuffers.length === 0) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        return res.end("No valid image files found in the folder.");
      }

      res.writeHead(OK, { "Content-Type": "application/json" });
      res.end(JSON.stringify(validFileBuffers));
    } catch (error) {
      console.error("An error occurred while processing the request.", error);
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end(
        "An error occurred while processing the request. Please try again later."
      );
    }
  }

  public async handleImageCompress(
    res: http.ServerResponse,
    req: any,
    root: string,
    width: number,
    height: number
  ) {
    const filePath = path.join(root, req.url);

    try {
      await fsPromises.access(filePath, fsConstants.F_OK);
    } catch (err) {
      console.error(`File ${req.url} does not exist`);
      return;
    }

    const imageExtension = path.extname(filePath);

    if (!CheckIfExistsInType(imageExtension.slice(1), imageTypesArray)) {
      throw new FancyError(INCORRECT_FILE_TYPE);
    }

    const cacheKey = `optimized:image:single${filePath}:${width}:${height}`;
    const cachedItem = this.memoryCache.get<Buffer>(cacheKey);

    if (cachedItem) {
      return res.end(cachedItem);
    }

    try {
      const buffer = await this.resizeImage(filePath, width, height);
      res.writeHead(OK, { "Content-Type": `image/${imageExtension.slice(1)}` });
      this.memoryCache.set(cacheKey, buffer, this.options.staticFileCacheTime);
      res.end(buffer);
    } catch (err) {
      console.error(err);
    }
  }

  public handleImage(res: http.ServerResponse, req: any, root: string) {
    const filePath = path.join(root, req.url);

    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        console.error(`File ${req.url} does not exist`);
        return;
      }
    });

    const imageExtension = path.extname(filePath);

    if (!CheckIfExistsInType(imageExtension.slice(1), imageTypesArray)) {
      throw new FancyError(INCORRECT_FILE_TYPE);
    }

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  }

  public async handleMultipleImagesCompress(
    res: http.ServerResponse,
    req: any,
    root: string,
    width: number,
    height: number
  ) {
    try {
      const readdir = promisify(fs.readdir);
      const folderPath = path.join(root, req.url);

      const files = await readdir(folderPath);
      const WorkerPromises: Promise<Buffer>[] = [];

      files.forEach((filePath: string) => {
        const absolutefilePath: string = path.join(root, req.url, filePath);
        const imageExtension = path.extname(filePath);

        const cacheKey = `optimized:image:multiple${absolutefilePath}:${width}:${height}`;

        const cachedItem = this.memoryCache.get<Promise<Buffer>>(cacheKey);

        if (!CheckIfExistsInType(imageExtension.slice(1), imageTypesArray)) {
          throw new FancyError("INCORRECT IMAGE TYPE");
        }

        if (cachedItem) {
          return WorkerPromises.push(cachedItem);
        }

        if (!fs.statSync(absolutefilePath).isFile()) {
          res.end("this folder does not contain files only");
          throw new Error("this folder has not only files in it");
        }

        const resizeData: WorkerProps = {
          filePath: absolutefilePath,
          width,
          height,
          imageExtension: imageExtension.slice(1) as ImageTypes,
        };

        const ImageResizeWorker = this.createWorkerForImageResizing(resizeData);

        this.memoryCache.set(
          cacheKey,
          ImageResizeWorker,
          this.options.staticFileCacheTime
        );

        WorkerPromises.push(ImageResizeWorker);
      });

      res.writeHead(OK, { "Content-Type": "multipart/mixed" });

      await Promise.all(WorkerPromises).then((buffers: Buffer[]) => {
        res.end(JSON.stringify(buffers));
      });
    } catch (err) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end(
        "An error occurred while processing the request. /handle images",
        err
      );
      throw new FancyError("error while reading images / compress");
    }
  }

  private createWorkerForImageResizing({
    filePath,
    width,
    height,
    imageExtension,
  }: WorkerProps): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const workerPath = path.resolve(
        __dirname,
        "../workers/resize-image-worker.ts"
      );
      const workerData: ImageResizeWorkerData = {
        filePath,
        width,
        height,
        imageExtension,
      };

      const worker = new Worker(workerPath, { workerData });

      worker.on("message", (buffer: Buffer) => {
        resolve(buffer);
      });

      worker.on("error", (err: Error) => {
        reject(err);
      });

      worker.on("exit", (code: number) => {
        if (code !== 0) {
          reject(new Error(`Worker stopped with exit code ${code}`));
        }
      });
    });
  }
}
