import http from 'http'
export const getStatsData = (req: http.IncomingMessage, res: http.ServerResponse<http.IncomingMessage>) => {
    const temporary: string = JSON.stringify(["siema", "siema1"])
    console.log("siema")
    res.write(temporary)
    res.end()
}

export const sendStatsData = (req: any, res: http.ServerResponse<http.IncomingMessage>) => {
    res.write(JSON.stringify(req.body))
    res.end()
}