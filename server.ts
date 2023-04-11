import http from 'http'
import fs from 'fs'
import path from 'path'
import { parseUrl } from './helpers/urlParser'
import { AllowCors } from './middleware/cors'
import { flatten2DArray } from './helpers/flatten'
import { NOT_FOUND } from './constants/statusCodes'
import { processMiddleware } from './middleware/process'
import { MethodsHandler, ServerInterface } from './interfaces/serverInterface'
import { Worker } from 'worker_threads';
import { ErrorNode, RequestType, Routes, RouteHandler, RouteMiddleware } from './interfaces/serverInterface'
import { isRequestTypeValid } from './helpers/request_type_validation'
const sharp = require('sharp');


const MIDDLEWARE = "middleware"


const STAIC_FILE_TYPES_TYPES = {
    html: 'text/html',
    css: 'text/css',
    js: 'application/javascript',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    json: 'application/json',
    xml: 'application/xml',
  };



  



export class Server implements ServerInterface {

    private routes: Routes = {}

    constructor(){
        
    }

    private BindFuncsToRoutes(
    method: RequestType, 
    path:string,  
    handler: Function, 
    middleware: Function[] | null = null): void{

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
            let body: string = ""
            req.on("data", (chunk: Buffer): void => {
                body += chunk
            })
            req.on("end", (): void => {
                resolve(body)
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
        let type = "";
      
        
            
        (extension in STAIC_FILE_TYPES_TYPES) ? 
        (type = STAIC_FILE_TYPES_TYPES
        [extension as keyof typeof STAIC_FILE_TYPES_TYPES]) : 
        type = STAIC_FILE_TYPES_TYPES.html
      
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
            const promises: Promise<Buffer>[] = [];

               
                files.forEach((file: string) => {
                    
                    const filePath: string = path.join(root, req.url, file);

                    if(!fs.statSync(filePath).isFile()){
                        res.end("this folder has not only files in it")
                        throw("this folder has not only files in it")
                    }

                    promises.push(this.createWorkerForImageResizing(filePath, 100, 100))
                });
                
                res.writeHead(200, {'Content-Type': 'image/jpeg'});

                Promise.all(promises).then((buffers: Buffer[]) => {
                    let yes = []
                    for(const i of buffers){
                        const buffer = Buffer.from(i);
                        yes.push(buffer)
                    }
                    res.end(JSON.stringify(yes))
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

    initServer(): MethodsHandler {
        const server = http.createServer(async (req: any, res: http.ServerResponse) => {

            if(req.url.startsWith("/music")){
                this.propagateStatic(req, res)
                return
            }   
           

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
    
                    AllowCors(res)
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
        })

        const ServerInstance: this = this

   
        server.listen(3002, () => {
            console.log("listening on port 3002")
        })
    
        return {

            get(path: string, handler: Function, ...middleware: Array<Function[]>): void {
                ServerInstance.BindFuncsToRoutes("get", path, handler, flatten2DArray(middleware))
            },

            post(path: string, handler: Function, ...middleware: Array<Function[]>): void {
                ServerInstance.BindFuncsToRoutes("post", path, handler, flatten2DArray(middleware))
                
            },

            patch(path: string, handler: Function, ...middleware: Array<Function[]>): void {
                ServerInstance.BindFuncsToRoutes("patch", path, handler, flatten2DArray(middleware))
            },

            put(path: string, handler: Function, ...middleware: Array<Function[]>): void {
                ServerInstance.BindFuncsToRoutes("put", path, handler, flatten2DArray(middleware))
            },

            delete(path: string, handler: Function, ...middleware: Array<Function[]>): void {
                ServerInstance.BindFuncsToRoutes("delete", path, handler, flatten2DArray(middleware))
            },

        }
    }
}

