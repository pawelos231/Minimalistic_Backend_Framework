export const DEFAULT_OPTIONS: Options = {
  compressImages: true,
  cacheStatic: true,
  staticFileCacheTime: 60,
  serverName: "nice server",
  rootDirectory: "/public",
  port: 3002,
};

export interface Options {
  compressImages: boolean;
  port: number;
  serverName: string;
  cacheStatic: boolean;
  staticFileCacheTime: number;
  rootDirectory: string;
}
