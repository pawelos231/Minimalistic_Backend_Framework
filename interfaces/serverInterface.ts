export interface Server<T> {
    get: (path: string, handler: Function, ...middleware: T[][]) => void
    put: (path: string, handler: Function, ...middleware: T[][]) => void
    patch: (path: string, handler: Function, ...middleware: T[][]) => void
    delete: (path: string, handler: Function, ...middleware: T[][]) => void
    post: (path: string, handler: Function, ...middleware: T[][]) => void
}

