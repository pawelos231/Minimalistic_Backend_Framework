export const DEFAULT_OPTIONS: Options = {
    compressImages: false,
    serverName: "",
    port: 3002,
    defaultStaticFileCache: 60
}

export interface Options {
  compressImages: boolean
  port: number
  serverName: string
  defaultStaticFileCache: number
}
