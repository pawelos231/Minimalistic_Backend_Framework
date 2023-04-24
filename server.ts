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
import sharp from 'sharp'


const MIDDLEWARE = "middleware"


export class Server implements ServerInterface {

    private routes: Routes = {}
    private middlewares: RouteMiddleware[] = []

    constructor({...options} = {}){
        const server = http.createServer(this.handleRequesWithMiddleware.bind(this))
        server.listen(3002, () => {
            console.log("listening on port 3002")
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


    private addRoute(
    method: RequestType, 
    path:string,  
    handler: RouteHandler, 
    middleware: RouteMiddleware[] | null = null): void{

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

    private createWorkerForImageResizing(filePath: string, width: number, height: number): Promise<Buffer>{

        const promise: Promise<Buffer> = new Promise((resolve, reject) => {

            const worker: Worker = new Worker(
                './workers/resize-image-worker.ts', 
                { workerData: {filePath, width, height} });

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
        return promise
    }

    private async propagateStatic(req: any, res: http.ServerResponse, pathToPropagate = "public"): Promise<void>{

        const directoryName: string = pathToPropagate;  
        const root: string = path.normalize(path.resolve(directoryName));

        const extension: string = path.extname(req.url).slice(1);
        let type: string = "";
      
        
            
        (extension in STAIC_FILE_TYPES_EXTENSIONS) ? 
        (type = STAIC_FILE_TYPES_EXTENSIONS
        [extension as keyof typeof STAIC_FILE_TYPES_EXTENSIONS]) : 
        type = STAIC_FILE_TYPES_EXTENSIONS.html
      
        const supportedExtension = Boolean(type);

     

        if (!supportedExtension) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
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

            const files = fs.readdirSync(path.join(root, req.url));
            const WorkerPromises: Promise<Buffer>[] = [];

               
                files.forEach((file: string) => {
                    
                    const filePath: string = path.join(root, req.url, file);

                    if(!fs.statSync(filePath).isFile()){
                        res.end("this folder does not contain files only")
                        throw new Error("this folder has not only files in it")
                    }

                    WorkerPromises.push(this.createWorkerForImageResizing(filePath, 100, 100))
                });
                
                //to fix
                res.writeHead(200, {'Content-Type': 'image/jpeg'});

                Promise.all(WorkerPromises).then((buffers: Buffer[]) => {
                    const ImagesBufferArray: Buffer[] = []
                    for(const i of buffers){
                        const buffer: Buffer = Buffer.from(i);
                        ImagesBufferArray.push(buffer)
                    }
                    res.end(JSON.stringify(ImagesBufferArray))
                });
               
                
        } else {

            const filePath = path.join(root, req.url)
            const image = sharp(filePath);
            image.resize(200, 200).toBuffer((err: any, buffer: any) => {
                res.setHeader('Content-Type', 'image/jpeg');
                res.end(buffer);
            });
        
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

                const handler: Function = this.routes[ROUTE][requestMethod]
                const middleware: Function[] = this.routes[ROUTE][MIDDLEWARE]
                
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
            res.statusCode = NOT_FOUND;

            const file: string = fs.readFileSync(path.resolve(__dirname, 'views', '404.html'), {
                encoding: "utf-8"
            })

            res.end(file)
        }

        res.end()
     }

  
    
    public get(path: string, handler: RouteHandler, ...middleware: RouteMiddleware[][]){
        this.addRoute(GET, path, handler, flatten2DArray(middleware))
    }
    

    public delete(path: string, handler: RouteHandler, ...middleware: RouteMiddleware[][]){
        this.addRoute(DELETE, path, handler, flatten2DArray(middleware))
    }


    public put(path: string, handler: RouteHandler, ...middleware: RouteMiddleware[][]){
        this.addRoute(PUT, path,handler, flatten2DArray(middleware))
    }


    public patch(path: string, handler: RouteHandler, ...middleware: RouteMiddleware[][]){
        this.addRoute(PATCH, path, handler, flatten2DArray(middleware))
    }


    public post(path: string, handler: RouteHandler, ...middleware: RouteMiddleware[][]){
        this.addRoute(POST, path, handler, flatten2DArray(middleware))
    }

    public use(middleware: any): void  {
        this.middlewares.push(middleware);
     };
}

