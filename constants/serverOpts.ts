export const DEFAULT_OPTIONS: Options = {
    compressImages: false,
    serverName: "",
    port: 3002,
    cacheStatic: true,
    staticFileCacheTime: 60
}

export interface Options {
  compressImages: boolean
  port: number
  serverName: string
  cacheStatic: boolean
  staticFileCacheTime: number
}
