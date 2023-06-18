import http from "http";
import fs from "fs";
import path from "path";
import { parseUrl } from "./helpers/urlParser";
import { flatten2DArray } from "./helpers/flatten";
import { processMiddleware } from "./middleware/process";
import { isRequestTypeValid } from "./helpers/request_type_validation";
import { CheckIfExistsInType } from "./helpers/TypeCheck";
import { areFilesInFolderImages } from "./helpers/getFilesInFolder";
import {
  STAIC_FILE_TYPES_EXTENSIONS,
  StaticFiles,
} from "./constants/StaticFileTypes";
import {
  POST,
  PUT,
  PATCH,
  DELETE,
  GET,
  NOT_FOUND,
  OK,
} from "./constants/responseHelpers";
import { DEFAULT_OPTIONS, Options } from "./constants/serverOpts";
import { imageTypesArray, ImageTypes } from "./constants/StaticFileTypes";
import { InMemoryCache } from "./cache/inMemoryCache";
import { FancyError } from "./exceptions/AugementedError";
import {
  ControllerMiddleware,
  RequestType,
  Routes,
  RouteHandler,
  RouteMiddleware,
  ServerInterface,
} from "./interfaces/serverInterface";
import { ImageHandler } from "./services/imageHandler";
import mime from "mime";
import rangeParser from "range-parser";
import {
  matchUrlAndMethod,
  extractParamsFromUrl,
  processMiddlewareChain,
  handle404Page,
} from "./services/handleRequestFuncs";

type ServerType = http.Server<
  typeof http.IncomingMessage,
  typeof http.ServerResponse
>;

const MIDDLEWARE = "MIDDLEWARE";

export class Server implements ServerInterface {
  private routes: Routes = {};
  private middlewares: RouteMiddleware[] = [];
  private serverName: string = "server";
  private server = null as ServerType;
  private options: Options = DEFAULT_OPTIONS;
  private memoryCache: InMemoryCache = new InMemoryCache();
  private imageHandler: ImageHandler;

  constructor(options = DEFAULT_OPTIONS) {
    if (options.serverName.length !== 0) {
      this.serverName = options.serverName;
    }

    this.options = options;
    this.server = http.createServer(this.handleRequesWithMiddleware.bind(this));
    this.server.listen(options.port, () => {
      console.log(`listening on port ${options.port}`);
    });
    this.imageHandler = new ImageHandler(this.memoryCache, this.options);
  }

  public handleRequesWithMiddleware(req: any, res: http.ServerResponse): void {
    let currentMiddlewareIndex: number = 0;
    if (req.url.startsWith(this.options.rootDirectory)) {
      this.propagateStatic(req, res);
      return;
    }

    const nextMiddleware = async (): Promise<void> => {
      const middleware = this.middlewares[currentMiddlewareIndex];

      currentMiddlewareIndex++;

      if (middleware) {
        middleware(req, res, nextMiddleware);
      } else {
        this.handleRequest(req, res);
      }
    };
    nextMiddleware();
  }

  private addRoute(
    method: RequestType,
    path: string,
    handler: RouteHandler,
    middleware: ControllerMiddleware[] | null = null
  ): void {
    if (!isRequestTypeValid(method.toLowerCase())) {
      throw new Error("wrong method");
    }

    if (typeof handler !== "function") {
      throw new Error("handler must be a func");
    }

    if (middleware && middleware.length > 0) {
      this.routes[path] = { [method]: handler, MIDDLEWARE: middleware };
    } else {
      this.routes[path] = { [method]: handler };
    }
  }

  private bodyReader(req: http.IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];

      req.on("data", (chunk: Buffer): void => {
        chunks.push(chunk);
      });
      req.on("end", (): void => {
        resolve(Buffer.concat(chunks).toString());
      });
      req.on("error", (err: Error): void => {
        reject(err);
      });
    });
  }

  private async serveMultipleFilesByExtension(
    req: any,
    res: http.ServerResponse,
    root: string
  ) {
    const absolutePath = path.join(root, req.url);
    const pathExists = fs.existsSync(absolutePath);
    const areImages = await areFilesInFolderImages(absolutePath);

    if (!pathExists) {
      res.statusCode = 404;
      res.end("File Not Found");
      return;
    }

    if (areImages) {
      console.log("Files are images");
      if (this.options.compressImages) {
        this.imageHandler.handleMultipleImagesCompress(
          res,
          req,
          root,
          150,
          150
        );
      } else {
        this.imageHandler.handleMultipleImages(res, req, root);
      }
    } else {
      res.statusCode = 200;
      res.setHeader("Content-Type", "text/plain");
      res.end("The requested URL is not a file.");
    }
  }

  private async handleNonImageStaticFile(
    req: any,
    res: http.ServerResponse,
    path: string
  ) {
    try {
      const stat = fs.statSync(path);
      const contentType = mime.getType(path) || "application/octet-stream";
      res.setHeader("Content-Type", contentType);

      const range = req.headers["range"];
      if (range) {
        const ranges = rangeParser(stat.size, range);
        if (ranges && ranges.length === 1) {
          const { start, end } = ranges[0];
          res.statusCode = 206;
          res.setHeader("Content-Range", `bytes ${start}-${end}/${stat.size}`);
          res.setHeader("Content-Length", end - start + 1);
          const stream = fs.createReadStream(path, { start, end });
          stream.pipe(res);
          return;
        }
      }

      res.setHeader("Content-Length", stat.size);
      const stream = fs.createReadStream(path);
      stream.pipe(res);
    } catch (error) {
      if (error.code === "ENOENT") {
        res.statusCode = 404;
        res.end("File Not Found");
      } else {
        res.statusCode = 500;
        res.end("Internal Server Error");
        console.error("Error serving static file:", error);
      }
    }
  }

  private async serveFileByExtension(
    extension: StaticFiles,
    req: any,
    res: http.ServerResponse,
    root: string
  ) {
    const isImage = CheckIfExistsInType(extension, imageTypesArray);
    const absolutePath = path.join(root, req.url);
    const pathExists = fs.existsSync(absolutePath);

    if (isImage && pathExists) {
      if (this.options.compressImages) {
        this.imageHandler.handleImageCompress(res, req, root, 200, 200);
      } else {
        this.imageHandler.handleImage(res, req, root);
      }
    }
    if (!isImage) {
      this.handleNonImageStaticFile(req, res, absolutePath);
    }
  }

  private async propagateStatic(
    req: any,
    res: http.ServerResponse,
    pathToPropagate = "public"
  ): Promise<void> {
    const directoryName: string = pathToPropagate;
    const root: string = path
      .normalize(path.resolve(directoryName))
      .replace(pathToPropagate, "");

    const extension: string = path.extname(req.url).slice(1);
    let type: string = "";

    extension in STAIC_FILE_TYPES_EXTENSIONS
      ? (type = STAIC_FILE_TYPES_EXTENSIONS[extension as StaticFiles])
      : (type = STAIC_FILE_TYPES_EXTENSIONS.html);

    const supportedExtension = Boolean(type);

    if (!supportedExtension) {
      console.log("extension is not supported!");
      res.writeHead(NOT_FOUND, { "Content-Type": "text/plain" });
      res.end("404: File not found");
      return;
    }

    if (!Boolean(extension)) {
      console.log("no extension, check if there are static files in");
      this.serveMultipleFilesByExtension(req, res, root);
    } else {
      this.serveFileByExtension(extension as StaticFiles, req, res, root);
    }
  }

  private async handleRequest(req: any, res: http.ServerResponse) {
    const keyRoutes: string[] = Object.keys(this.routes);
    let match: boolean = false;

    for (const ROUTE of keyRoutes) {
      const parsedRoute: string = parseUrl(ROUTE);
      const requestMethod: string = req.method.toLowerCase();

      const urlMatchesMethodCorrect: boolean = matchUrlAndMethod(
        req.url,
        parsedRoute,
        requestMethod,
        ROUTE
      );

      if (urlMatchesMethodCorrect) {
        const handler: RouteHandler = this.routes[ROUTE][requestMethod];
        const middleware: RouteMiddleware[] = this.routes[ROUTE][MIDDLEWARE];

        if (middleware) {
          await processMiddlewareChain(middleware, req, res);
        }

        req.params = extractParamsFromUrl(req.url, parsedRoute);
        req.body = await this.bodyReader(req);

        await handler(req, res);

        match = true;
        break;
      }
    }

    if (!match) {
      return handle404Page(res);
    }

    res.end();
  }

  public get(
    path: string,
    handler: RouteHandler,
    ...middleware: ControllerMiddleware[][]
  ) {
    this.addRoute(GET, path, handler, flatten2DArray(middleware));
  }

  public delete(
    path: string,
    handler: RouteHandler,
    ...middleware: ControllerMiddleware[][]
  ) {
    this.addRoute(DELETE, path, handler, flatten2DArray(middleware));
  }

  public put(
    path: string,
    handler: RouteHandler,
    ...middleware: ControllerMiddleware[][]
  ) {
    this.addRoute(PUT, path, handler, flatten2DArray(middleware));
  }

  public patch(
    path: string,
    handler: RouteHandler,
    ...middleware: ControllerMiddleware[][]
  ) {
    this.addRoute(PATCH, path, handler, flatten2DArray(middleware));
  }

  public post(
    path: string,
    handler: RouteHandler,
    ...middleware: ControllerMiddleware[][]
  ) {
    this.addRoute(POST, path, handler, flatten2DArray(middleware));
  }

  public use(middleware: RouteMiddleware): void {
    this.middlewares.push(middleware);
  }

  public shutDown() {
    console.log("shutting down...");
    this.server.close(() => {
      console.log(`${this.serverName} terminated.`);
      process.exit(0);
    });
  }
}
