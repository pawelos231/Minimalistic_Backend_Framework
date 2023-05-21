import http from 'http'
import fs from 'fs'
import path from 'path'
import { parseUrl } from './helpers/urlParser'
import { flatten2DArray } from './helpers/flatten'
import { processMiddleware } from './middleware/process'
import { ServerInterface } from './interfaces/serverInterface'
import { Worker } from 'worker_threads';
import { RequestType, Routes, RouteHandler, RouteMiddleware } from './interfaces/serverInterface'
import { isRequestTypeValid } from './helpers/request_type_validation'
import { STAIC_FILE_TYPES_EXTENSIONS } from './constants/StaticFileTypes'
import { POST, PUT, PATCH, DELETE, GET, NOT_FOUND } from './constants/responseHelpers'
import { ControllerMiddleware } from './interfaces/serverInterface'
import sharp from 'sharp'
import { DEFAULT_OPTIONS } from './constants/serverOpts'
import { Options } from './constants/serverOpts'
import { StaticFiles } from './constants/StaticFileTypes'
import { InMemoryCache } from './cache/inMemoryCache'
import { OK } from './constants/responseHelpers'
import { ImageResizeWorkerData } from './interfaces/serverInterface'
import { ImageTypes } from './constants/StaticFileTypes'
import { CheckIfExistsInType } from './helpers/TypeCheck'
import { imageTypesArray } from './constants/StaticFileTypes'


type ServerType = http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>

const MIDDLEWARE = "middleware"

export class Server implements ServerInterface {

    private routes: Routes = {}
    private middlewares: RouteMiddleware[] = []
    private serverName: string = "server"
    private server = null as ServerType
    private options: Options
    private memoryCache: InMemoryCache = new InMemoryCache()

    constructor(options = DEFAULT_OPTIONS as Options){

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
            if(req.url.startsWith("/music")){
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

    private createWorkerForImageResizing (filePath: string, width: number, height: number, imageExtension: ImageTypes): Promise<Buffer>{

        const ResizeImagePromise: Promise<Buffer> = new Promise((resolve, reject) => {
            const absolute = path.resolve('./workers/resize-image-worker.ts')


            const workerData: ImageResizeWorkerData = 
            {filePath, width, height, imageExtension}

            const worker: Worker = new Worker(absolute, { workerData });

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


    private async handleImageCompress(res: http.ServerResponse, req: any, root: string, width: number, height: number){
        
        const filePath = path.join(root, req.url)
        const imageExtension = path.extname(filePath)

        const cacheKey = `optimized:image:single${filePath}`
        const cachedItem = this.memoryCache.get<Buffer>(cacheKey)

        if(cachedItem){
            res.end(cachedItem);
            return
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
        const filesPaths = fs.readdirSync(path.join(root, req.url));
        const WorkerPromises: Promise<Buffer>[] = [];

               
        filesPaths.forEach((filePath: string) => {

            const absolutefilePath: string = path.join(root, req.url, filePath);
            const imageExtension = path.extname(filePath)
            
            if(!CheckIfExistsInType(imageExtension.slice(1), imageTypesArray  as unknown as  ImageTypes[])){
                return false
            }

            const cacheKey = `optimized:image:multiple${absolutefilePath}`
            const cachedItem = this.memoryCache.get<Promise<Buffer>>(cacheKey)
    
            if(cachedItem){
                WorkerPromises.push(cachedItem)
                return
            }        

            if(!fs.statSync(absolutefilePath).isFile()){
                res.end("this folder does not contain files only")
                throw new Error("this folder has not only files in it")
            }
            
            const ImageResizeWorker = this.createWorkerForImageResizing(absolutefilePath, width, height, imageExtension.slice(1) as ImageTypes)

            this.memoryCache.set(cacheKey, ImageResizeWorker, this.options.staticFileCacheTime)

            WorkerPromises.push(ImageResizeWorker)
        });
                
        res.writeHead(OK, {'Content-Type': 'multipart/mixed'});

        Promise.all(WorkerPromises).then((buffers: Buffer[]) => {
             res.end(JSON.stringify(buffers))
        });
    }

    private async propagateStatic(req: any, res: http.ServerResponse, pathToPropagate = "public"): Promise<void>{


        const directoryName: string = pathToPropagate;  
        const root: string = path.normalize(path.resolve(directoryName));

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

        let fileName = req.url;

        if (!extension) {
            try {
              fs.accessSync(path.join(root, req.url + '.html'), fs.constants.F_OK);
              fileName = req.url + '.html';
            } catch (e) {
              fileName = path.join(req.url, 'index.html');
            }
          }
          

        if (fs.existsSync(path.join(root, req.url)) && !extension) {
            this.handleMultipleImagesCompress(res, req, root, 100, 100)     
        } else {
            this.handleImageCompress(res, req, root, 200, 200)
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

