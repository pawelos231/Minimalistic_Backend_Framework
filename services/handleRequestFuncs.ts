import { processMiddleware } from "../middleware/process";
import { RouteMiddleware } from "../interfaces/serverInterface";
import http from "http";
import { NOT_FOUND } from "../constants/responseHelpers";
import path from "path";
import fs from "fs";

function matchUrlAndMethod(
  url: string,
  parsedRoute: string,
  requestMethod: string,
  ROUTE: string
): boolean {
  return new RegExp(parsedRoute).test(url) && this.routes[ROUTE][requestMethod];
}

function extractParamsFromUrl(url: string, parsedRoute: string): object {
  const matcher = url.match(new RegExp(parsedRoute));
  return matcher ? matcher.groups : {};
}

async function processMiddlewareChain(
  middleware: RouteMiddleware[],
  req: any,
  res: http.ServerResponse
): Promise<void> {
  for (const func of middleware) {
    await processMiddleware(func, req, res);
  }
}

function handle404Page(res: http.ServerResponse): void {
  res.writeHead(NOT_FOUND, { "Content-Type": "text/html" });

  const file: string = fs.readFileSync(
    path.resolve(__dirname, "views", "404.html"),
    {
      encoding: "utf-8",
    }
  );

  res.end(file);
}

export {
  matchUrlAndMethod,
  extractParamsFromUrl,
  processMiddlewareChain,
  handle404Page,
};
