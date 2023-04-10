import http from 'http'
import fs from 'fs'
import path from 'path'
import { parseUrl } from './helpers/urlParser'
import { AllowCors } from './middleware/cors'
import { flatten2DArray } from './helpers/flatten'
import { NOT_FOUND } from './constants/statusCodes'
import { processMiddleware } from './middleware/process'
import { MethodsHandler, ServerInterface } from './interfaces/serverInterface'

const MIDDLEWARE = "middleware"


const TYPES = {
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

const directoryName = 'public';  
const root = path.normalize(path.resolve(directoryName));
console.log(root)


export class Server implements ServerInterface {
    private routes: any = {}
    constructor(){
        
    }
    private BindFuncsToRoutes(
    method: string, 
    path:string,  
    handler: Function, 
    middleware: Function[] | null = null): void{
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

    ProvideFileServerFunctions(req: any, res: http.ServerResponse): void{

        const extension: string = path.extname(req.url).slice(1);
        let type = "";
        
            
        (extension in TYPES) ? 
        type = TYPES[extension as keyof typeof TYPES] : 
        type = TYPES.html
      
        const supportedExtension = Boolean(type);
        console.log(fs.existsSync(path.join(root, "/SongsImages")))

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

        const filePath: string = path.join(root, fileName)
        const isPathUnderRoot: boolean = path
            .normalize(path.resolve(filePath))
            .startsWith(root);

        if(!isPathUnderRoot){
            res.end('404: File not found');
            return;
        }

        fs.readFile(filePath, (err, data)=> {
            if(err){
                res.end('404: File not found');
            } else {
                res.writeHead(200, { 'Content-Type': type });
                res.end(data);
            }
        })

    }

    initServer(): MethodsHandler {
        const server = http.createServer(async (req: any, res: http.ServerResponse) => {

            this.ProvideFileServerFunctions(req, res)

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

        const ServerInstance = this

   
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

