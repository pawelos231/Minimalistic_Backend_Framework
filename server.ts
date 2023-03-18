import http from 'http'
import fs from 'fs'
import path from 'path'
import { parseUrl } from './helpers/urlParser'
import { Server } from './interfaces/serverInterface'
import { AllowCors } from './middleware/cors'
import { flatten2DArray } from './helpers/flatten'
import { NOT_FOUND } from './constants/statusCodes'
import { processMiddleware } from './middleware/process'

const MIDDLEWARE = "middleware"
const routes: any = []

const BindFuncsToRoutes = (
    method: string, 
    path:string,  
    handler: Function, 
    middleware: Function[] | null = null): void => 
    {
        if(typeof handler !== "function"){
            throw new Error("handler must be a func")
        }
        if (middleware && middleware.length > 0) {
            routes[path] = { [method]: handler, MIDDLEWARE: middleware }
        } else {
            routes[path] = { [method]: handler }
        }
    }

const bodyReader = (req: http.IncomingMessage): Promise<string> => {
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

export const initServer = (): Server => {
    const server = http.createServer(async (req: any, res: http.ServerResponse) => {
        const keyRoutes: string[] = Object.keys(routes)
        let match: boolean = false

        for (const ROUTE of keyRoutes) {

            const parsedRoute: string = parseUrl(ROUTE)
            const requestMethod: string = req.method.toLowerCase()

            const urlMatchesMethodCorrect: boolean = new RegExp(parsedRoute).test(req.url) && routes[ROUTE][requestMethod]

            if (urlMatchesMethodCorrect) {
                const handler: Function = routes[ROUTE][requestMethod]
                const middleware: Function[] = routes[ROUTE][MIDDLEWARE]
                if (middleware) {
                    for (const [key, func] of middleware.entries()) {
                        processMiddleware(func, req, res)
                    }
                }

                const matcher = req.url.match(new RegExp(parsedRoute))
                req.params = matcher.groups
                req.body = await bodyReader(req)

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
    server.listen(3002, () => {
        console.log("listening on port 3002")
    })

    return {
        get(path: string, handler: Function, ...middleware: Array<Function[]>): void {
            BindFuncsToRoutes("get", path, handler, flatten2DArray(middleware))
        },
        post(path: string, handler: Function, ...middleware: Array<Function[]>): void {
            BindFuncsToRoutes("post", path, handler, flatten2DArray(middleware))
            
        },
        patch(path: string, handler: Function, ...middleware: Array<Function[]>): void {
            BindFuncsToRoutes("patch", path, handler, flatten2DArray(middleware))
        },
        put(path: string, handler: Function, ...middleware: Array<Function[]>): void {
            BindFuncsToRoutes("put", path, handler, flatten2DArray(middleware))
        },
        delete(path: string, handler: Function, ...middleware: Array<Function[]>): void {
            BindFuncsToRoutes("delete", path, handler, flatten2DArray(middleware))
        },
    }
}
