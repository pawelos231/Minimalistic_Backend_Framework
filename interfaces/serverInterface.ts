export interface Server {
    get: (path: string, handler: Function, ...middleware: Function[][]) => void
    put: (path: string, handler: Function, ...middleware: Function[][]) => void
    patch: (path: string, handler: Function, ...middleware: Function[][]) => void
    delete: (path: string, handler: Function, ...middleware: Function[][]) => void
    post: (path: string, handler: Function, ...middleware: Function[][]) => void
}

