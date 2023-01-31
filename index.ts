import fs from 'fs'
import http from 'http'

function bodyReader(req: http.IncomingMessage): Promise<unknown> {
    return new Promise((resolve, reject) => {
        let body: string = ""
        req.on("data", function (chunk): void {
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
const initServer = () => {
    const server = http.createServer(async (req: any, res: http.ServerResponse) => {
        if (req.url == "/") {
            fs.createReadStream("./testclient.html", {
                encoding: "utf-8"
            }).pipe(res)
        } else if (req.url == "/siema") {
            req.body = await bodyReader(req)
            console.log(req.body)
            res.write(req.body)
        }
        return {
            get: () => "siema"
        }
    })
    console.log(server)
    server.listen(3002, () => {
        console.log("listening on port 3002")
    })
    return {
        get: () => "siema"
    }
}

console.log(initServer)



