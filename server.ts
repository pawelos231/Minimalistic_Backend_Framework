import http from 'http'
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import { Worker } from 'worker_threads';
import { parseUrl } from './helpers/urlParser'
import { flatten2DArray } from './helpers/flatten'
import { processMiddleware } from './middleware/process'
import { isRequestTypeValid } from './helpers/request_type_validation'
import { CheckIfExistsInType } from './helpers/TypeCheck'
import { areFilesInFolderImages } from './helpers/getFilesInFolder'
import { STAIC_FILE_TYPES_EXTENSIONS } from './constants/StaticFileTypes'
import { POST, PUT, PATCH, DELETE, GET, NOT_FOUND, OK } from './constants/responseHelpers'
import { DEFAULT_OPTIONS } from './constants/serverOpts'
import { Options } from './constants/serverOpts'
import { StaticFiles } from './constants/StaticFileTypes'
import { imageTypesArray, ImageTypes } from './constants/StaticFileTypes'
import { InMemoryCache } from './cache/inMemoryCache'
import { FancyError } from './exceptions/AugementedError'
import { 
    ControllerMiddleware, 
    ImageResizeWorkerData,  
    RequestType, 
    Routes,
    RouteHandler, 
    RouteMiddleware, 
    ServerInterface  
} from './interfaces/serverInterface'

type ServerType = http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>

type WorkerProps = {
    filePath: string
    width: number
    height: number
    imageExtension: ImageTypes
}

const MIDDLEWARE = "middleware"

export class Server implements ServerInterface {

    private routes: Routes = {}
    private middlewares: RouteMiddleware[] = []
    private serverName: string = "server"
    private server = null as ServerType
    private options: Options = DEFAULT_OPTIONS
    private memoryCache: InMemoryCache = new InMemoryCache()

    constructor(options = DEFAULT_OPTIONS){

        if(options.serverName.length != 0){
            this.serverName = options.serverName
        }

        this.options = options
        this.server = http.createServer(this.handleRequesWithMiddleware.bind(this))
        this.server.listen(options.port, () => {
            console.log(`listening on port ${options.port}`)
        })
    }



    public handleRequesWithMiddleware(req: any, res: http.ServerResponse): void {
       
             //provide better solution for chekcing what to serve
            let currentMiddlewareIndex: number = 0;
            if(req.url.startsWith(this.options.rootDirectory)){
                this.propagateStatic(req, res)
                return
            }
         

            const nextMiddleware = async (): Promise<void> => {
                const middleware =
                this.middlewares[currentMiddlewareIndex];

                currentMiddlewareIndex++;
                
                if (middleware) {
                    middleware(req, res, nextMiddleware);
                } else {
                  this.handleRequest(req, res);
                }

            
              };
            nextMiddleware()
    
    }


    private addRoute(method: RequestType, 
    path:string,  
    handler: RouteHandler, 
    middleware: ControllerMiddleware[] | null = null): void{

        if(!isRequestTypeValid(method.toLowerCase())){
            throw new Error("wrong method")
        }

        if(typeof handler !== "function"){
            throw new Error("handler must be a func")
        }

        if (middleware && middleware.length > 0) {
            this.routes[path] = { [method]: handler, MIDDLEWARE: middleware }
        } else {
            this.routes[path] = { [method]: handler }
        }

    }

    private bodyReader(req: http.IncomingMessage): Promise<string>{
        return new Promise((resolve, reject) => {

            const chunks: Buffer[] = []

            req.on("data", (chunk: Buffer): void => {
                chunks.push(chunk)
            })
            req.on("end", (): void => {
                resolve(Buffer.concat(chunks).toString())
            })
            req.on("error", (err: Error): void => {
                reject(err);
            });
        })
    }

    private createWorkerForImageResizing ({filePath, width, height, imageExtension}: WorkerProps): Promise<Buffer>{

        const ResizeImagePromise: 
        Promise<Buffer> = new Promise((resolve, reject) => {

            const workerPath = path.resolve('./workers/resize-image-worker.ts')

            const workerData: ImageResizeWorkerData = 
            {filePath, width, height, imageExtension}

            const worker: Worker = new Worker(workerPath, { workerData });

            worker.on("message", (buffer: Buffer) => {
                resolve(buffer)
            })
            worker.on('error', (err: Error) => {
                reject(err);
            });
            worker.on('exit', (code: number) => {
                if (code !== 0) {
                  reject(new Error(`Worker stopped with exit code ${code}`));
                }
              });
            
        })
        return ResizeImagePromise
    }



    private handleImage(res: http.ServerResponse, req: any, root: string){

        const filePath = path.join(root, req.url)

        fs.access(filePath, fs.constants.F_OK, (err) => {
            if (err) {
              console.error(`File ${req.url} does not exist`);
              return;
            }
        })

        const imageExtension = path.extname(filePath)

        if(!CheckIfExistsInType(imageExtension.slice(1), imageTypesArray)){
            throw new FancyError("INCORRECT IMAGE TYPE")
        }

        const fileStream = fs.createReadStream(filePath)
        fileStream.pipe(res)
    }



    private handleMultipleImages(res: http.ServerResponse, req: any, root: string) {

    try{
        const filesPaths: string[] = fs.readdirSync(path.join(root, req.url));

        if (filesPaths.length === 0) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            return res.end('No files found in the folder.');
        }

        const fileBuffers: Uint8Array[] = [];
        filesPaths.forEach((filePath: string) => {
            
             const absolutefilePath: string = path.join(root, req.url, filePath);
             const imageExtension = path.extname(filePath)
 
 
             if(!fs.statSync(absolutefilePath).isFile()){
                 res.end("this folder does not contain files only")
                 throw new FancyError("this folder has not only files in it")
             }
             
             if(!CheckIfExistsInType(imageExtension.slice(1), imageTypesArray)){
                 throw new FancyError("INCORRECT IMAGE TYPE")
             }
 
             const fileBuffer = fs.readFileSync(absolutefilePath);
             const fileArray = new Uint8Array(fileBuffer);
             fileBuffers.push(fileArray);


        })

        res.writeHead(OK, {'Content-Type': 'multipart/mixed'});
        res.end(JSON.stringify(fileBuffers))
        
    } 

    catch(err){
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('An error occurred while processing the request. /handle images', err);
            throw new FancyError("error while reading images / no compress")   
        }  
    }

    
    private async handleImageCompress(res: http.ServerResponse, req: any, root: string, width: number, height: number){
        
        const filePath = path.join(root, req.url)

        fs.access(filePath, fs.constants.F_OK, (err) => {
            if (err) {
              console.error(`File ${req.url} does not exist`);
              return;
            }
        })

        const imageExtension = path.extname(filePath)

        const cacheKey = `optimized:image:single${filePath}:${width}:${height}`
        const cachedItem = this.memoryCache.get<Buffer>(cacheKey)

        if(!CheckIfExistsInType(imageExtension.slice(1), imageTypesArray)){
            throw new FancyError("INCORRECT IMAGE TYPE")
        }
        
        if(cachedItem){
            return res.end(cachedItem);
        }  

        const image = sharp(filePath);

        image.resize(width, height).toBuffer((err, buffer: Buffer) => {   

            res.writeHead(OK, 
            {'Content-Type': `image/${imageExtension.slice(1)}`});

            this.memoryCache.set(cacheKey, buffer, 
                this.options.staticFileCacheTime)

            res.end(buffer);

            if(err){
                throw new Error(String(err))
            }
        });

    }



    private handleMultipleImagesCompress(res: http.ServerResponse, req: any, root: string, width: number, height: number){

    try{
        const filesPaths: string[] = fs.readdirSync(path.join(root, req.url));
        const WorkerPromises: Promise<Buffer>[] = [];

               
        filesPaths.forEach((filePath: string) => {

            const absolutefilePath: string = path.join(root, req.url, filePath);
            const imageExtension = path.extname(filePath)

            const cacheKey = 
            `optimized:image:multiple${absolutefilePath}:${width}:${height}`

            const cachedItem = this.memoryCache.get<Promise<Buffer>>(cacheKey)
            
            if(!CheckIfExistsInType(imageExtension.slice(1), imageTypesArray)){
                throw new FancyError("INCORRECT IMAGE TYPE")
            }

            if(cachedItem){
                return WorkerPromises.push(cachedItem)
            }        

            if(!fs.statSync(absolutefilePath).isFile()){
                res.end("this folder does not contain files only")
                throw new Error("this folder has not only files in it")
            }
            

            const resizeData: WorkerProps = {
                filePath: absolutefilePath,
                width,
                height,
                imageExtension: imageExtension.slice(1) as ImageTypes
            }

            const ImageResizeWorker = 
            this.createWorkerForImageResizing(resizeData)

            this.memoryCache.set(cacheKey, ImageResizeWorker, this.options.staticFileCacheTime)

            WorkerPromises.push(ImageResizeWorker)
        });
                
        res.writeHead(OK, {'Content-Type': 'multipart/mixed'});

        Promise.all(WorkerPromises).then((buffers: Buffer[]) => {
             res.end(JSON.stringify(buffers))
        });
    } 
    catch(err){
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('An error occurred while processing the request. /handle images', err);
        throw new FancyError("error while reading images / compress")   
    }
}

    private async serveMultipleFilesByExtension(req: any, res: http.ServerResponse, root: string){

        const absolutePath = path.join(root, req.url)
        const areImages = areFilesInFolderImages(absolutePath)
        const pathExists = fs.existsSync(absolutePath)

        if(areImages && pathExists){
            console.log("files are images")
            if(this.options.compressImages){
                this.handleMultipleImagesCompress(res, req, root, 150, 150)
            }else {
                this.handleMultipleImages(res, req, root)
            }
        }
    }



    private async serveFileByExtension(extension: StaticFiles, req: any, res: http.ServerResponse, root: string){

        const isImage = CheckIfExistsInType(extension, imageTypesArray)
        const absolutePath = path.join(root, req.url)
        const pathExists = fs.existsSync(absolutePath)

       if(isImage && pathExists) {
            if(this.options.compressImages){
                this.handleImageCompress(res, req, root, 200, 200)
            } else {
                this.handleImage(res, req, root)
            }
         }
        
    }



    private async propagateStatic(req: any, res: http.ServerResponse, pathToPropagate = "public"): Promise<void>{


        const directoryName: string = pathToPropagate;  
        const root: string = path.normalize(path.resolve(directoryName)).replace(pathToPropagate, "");


        const extension: string = path.extname(req.url).slice(1);
        let type: string = "";

            
        (extension in STAIC_FILE_TYPES_EXTENSIONS) ? 
        (type = STAIC_FILE_TYPES_EXTENSIONS
        [extension as StaticFiles]) : 
        type = STAIC_FILE_TYPES_EXTENSIONS.html

        const supportedExtension = Boolean(type);


        if (!supportedExtension) {
            console.log("extension is not supported!")
            res.writeHead(NOT_FOUND, { 'Content-Type': 'text/plain' });
            res.end('404: File not found');
            return;
        }

        if (!Boolean(extension)) {
            console.log("no extension, check if there are static files in")
            this.serveMultipleFilesByExtension(req, res, root)
        } else {
            this.serveFileByExtension(extension as StaticFiles, req,  res, root) 
        }

    }

     

     private async handleRequest(req: any, res: http.ServerResponse){

        const keyRoutes: string[] = Object.keys(this.routes)
        let match: boolean = false

    
        for (const ROUTE of keyRoutes) {

          
            const parsedRoute: string = parseUrl(ROUTE)
            const requestMethod: string = req.method.toLowerCase()

            const urlMatchesMethodCorrect: boolean = new RegExp(parsedRoute).test(req.url) && this.routes[ROUTE][requestMethod]

            if (urlMatchesMethodCorrect) {

                const handler: RouteHandler = this.routes[ROUTE][requestMethod]
                const middleware: RouteMiddleware[] = 
                this.routes[ROUTE][MIDDLEWARE]
                
                if (middleware) {
                    for (const [key, func] of middleware.entries()) {
                        processMiddleware(func, req, res)
                    }
                }

                const matcher = req.url.match(new RegExp(parsedRoute))
                req.params = matcher.groups
                req.body = await this.bodyReader(req)

              
                handler(req, res)

                match = true
                break;
            }
        }


        if (!match) {
            res.writeHead(NOT_FOUND, { 'Content-Type': 'text/html' });

            const file: string = fs.readFileSync(path.resolve(__dirname, 'views', '404.html'), {
                encoding: "utf-8"
            })

            res.end(file)
        }

        res.end()
     }

  
    
    public get(path: string, handler: RouteHandler, ...middleware: ControllerMiddleware[][]){
        this.addRoute(GET, path, handler, flatten2DArray(middleware))
    }
    

    public delete(path: string, handler: RouteHandler, ...middleware: ControllerMiddleware[][]){
        this.addRoute(DELETE, path, handler, flatten2DArray(middleware))
    }


    public put(path: string, handler: RouteHandler, ...middleware: ControllerMiddleware[][]){
        this.addRoute(PUT, path,handler, flatten2DArray(middleware))
    }


    public patch(path: string, handler: RouteHandler, ...middleware: ControllerMiddleware[][]){
        this.addRoute(PATCH, path, handler, flatten2DArray(middleware))
    }


    public post(path: string, handler: RouteHandler, ...middleware: ControllerMiddleware[][]){
        this.addRoute(POST, path, handler, flatten2DArray(middleware))
    }

    public use(middleware: RouteMiddleware): void  {
        this.middlewares.push(middleware);
     };

     public shutDown(){
        console.log("shutting down...")
        this.server.close(() => {
            console.log('Server terminated.');
            process.exit(0);
        })
     }
     
}

