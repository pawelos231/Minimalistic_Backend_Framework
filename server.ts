import http from 'http'
import { parseUrl } from './helpers/urlParser'
import { Server } from './interfaces/serverInterface'
import { AllowCors } from './middleware/cors'
let routes: any = []

function bodyReader(req: http.IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
        let body: string = ""
        req.on("data", function (chunk: Buffer): void {
            body += chunk
        })
        req.on("end", function (): void {
            resolve(body)
        })
        req.on("error", (err: Error) => {
            reject(err);
        });
    })

}

export const initServer = (): Server => {
    const server = http.createServer(async (req: any, res: http.ServerResponse) => {
        const keyRoutes: any = Object.keys(routes)
        let match: boolean = false
        for (const key of keyRoutes) {
            console.log(key)
            const parsedRoute: string = parseUrl(key)
            const urlMatchesMethodCorrect: boolean = new RegExp(parsedRoute).test(req.url) && routes[key][req.method.toLowerCase()]
            if (urlMatchesMethodCorrect) {
                const handler = routes[key][req.method.toLowerCase()]
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
            res.statusCode = 404;
            res.end("Not found");
        }
        res.end()
    })
    server.listen(3002, () => {
        console.log("listening on port 3002")
    })
    return {
        get(path: string, handler: Function) {
            routes[path] = { "get": handler }
        },
        post(path: string, handler: Function) {
            routes[path] = { "post": handler }
        },
        patch(path: string, handler: Function) {
            routes[path] = { "patch": handler }
        },
        put(path: string, handler: Function) {
            routes[path] = { "put": handler }
        },
        delete(path: string, handler: Function) {
            routes[path] = { "delete": handler }
        },
    }
}