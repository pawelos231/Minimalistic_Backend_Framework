export interface Server<T> {
    get: (path: string, handler: any, ...middleware: Array<T[]>) => void
    put: (path: string, handler: any) => void
    patch: (path: string, handler: any) => void
    delete: (path: string, handler: any) => void
    post: (path: string, handler: any) => void
}

