import http from 'http'
export const getStatsData = (req: http.IncomingMessage, res: http.ServerResponse<http.IncomingMessage>) => {
    const temporary: string = JSON.stringify(["siema", "siema1"])
    res.write(temporary)
    res.end()
}