import http from 'http'

function bodyReader(req) {
    return new Promise((resolve, reject) => {

    })

}

http.createServer((req: http.IncomingMessage, res: http.ServerResponse<http.IncomingMessage>) => {
    req.on("data", function () {
        console.log("got some data")
    })
    req.on("end", () => {
        console.log("send response")
    })
    if (req.url == "/") {
        res.write("siema")
        res.end()
    }
}).listen(3001, () => {
    console.log("listening on port 3001")
})