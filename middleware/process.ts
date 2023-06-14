import http from "http";
export const processMiddleware = (
  middleware: Function | null,
  req: any,
  res: http.ServerResponse
): Promise<boolean> => {
  if (!middleware) {
    return new Promise((resolve) => resolve(false));
  }
  return new Promise((resolve) => {
    middleware(req, res);
    resolve(true);
  });
};
