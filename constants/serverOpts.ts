export const DEFAULT_OPTIONS: Options = {
  compressImages: true,
  serverName: "",
  port: 3002,
  cacheStatic: true,
  staticFileCacheTime: 60,
  rootDirectory: "/public",
  compressionResposne: false,
  compressionThreshold: 0,
};

export interface Options {
  compressImages: boolean;
  port: number;
  serverName: string;
  cacheStatic: boolean;
  staticFileCacheTime: number;
  rootDirectory: string;
  compressionThreshold: number;
  compressionResposne: boolean;
}
