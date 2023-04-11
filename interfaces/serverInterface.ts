export interface MethodsHandler {
    get: (path: string, handler: Function, ...middleware: Function[][]) => void
    put: (path: string, handler: Function, ...middleware: Function[][]) => void
    patch: (path: string, handler: Function, ...middleware: Function[][]) => void
    delete: (path: string, handler: Function, ...middleware: Function[][]) => void
    post: (path: string, handler: Function, ...middleware: Function[][]) => void
   
}

export interface ServerInterface {
    initServer: () => MethodsHandler
}


export type ErrorNode = NodeJS.ErrnoException | null

export interface RouteHandler {
    (...args: any[]): any;
  }
  
export interface RouteMiddleware {
    (...args: any[]): any;
  }

export type RequestType = 'get' | 'post' | 'put' | 'delete' | 'patch';
  
export  type Routes = {
    [path: string]: {
      [method in RequestType]?: RouteHandler;
    } & { MIDDLEWARE?: Function[] };
  };