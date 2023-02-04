import http from 'http'
import fs from 'fs'
import { parseUrl } from './helpers/urlParser'
import { Server } from './interfaces/serverInterface'
import { AllowCors } from './middleware/cors'
import { flatten2DArray } from './helpers/flatten'
import { NOT_FOUND } from './consts/statusCodes'
import { processMiddleware } from './middleware/process'

const MIDDLEWARE = "middleware"

let routes: any = []
function bodyReader(req: http.IncomingMessage): Promise<string> {
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

export const initServer = (): Server<Function & any[]> => {
    const server = http.createServer(async (req: any, res: http.ServerResponse) => {
        const keyRoutes: string[] = Object.keys(routes)
        let match: boolean = false

        for (const key of keyRoutes) {

            const parsedRoute: string = parseUrl(key)
            const requestMethod: string = req.method.toLowerCase()
            const urlMatchesMethodCorrect: boolean = new RegExp(parsedRoute).test(req.url) && routes[key][requestMethod]

            if (urlMatchesMethodCorrect) {
                const handler: Function = routes[key][requestMethod]
                const middleware: Function[] = routes[key][MIDDLEWARE]

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
            res.end("not found")
        }

        res.end()
    })
    server.listen(3002, () => {
        console.log("listening on port 3002")
    })

    return {
        get<T>(path: string, handler: Function, ...middleware: Array<T[]>): void {
            const flattenedMiddleware: T[] = flatten2DArray<T>(middleware).filter((item: T) => typeof item === "function")
            console.log(flattenedMiddleware)
            if (flattenedMiddleware.length > 0) {
                routes[path] = { "get": handler, "middleware": flattenedMiddleware }
            } else {
                routes[path] = { "get": handler }
            }
        },
        post(path: string, handler: Function): void {
            routes[path] = { "post": handler }
        },
        patch(path: string, handler: Function): void {
            routes[path] = { "patch": handler }
        },
        put(path: string, handler: Function): void {
            routes[path] = { "put": handler }
        },
        delete(path: string, handler: Function): void {
            routes[path] = { "delete": handler }
        },
    }
}