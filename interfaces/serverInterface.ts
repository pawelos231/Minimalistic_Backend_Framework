export interface Server {
    get: (path: string, handler: any) => void
    put: (path: string, handler: any) => void
    patch: (path: string, handler: any) => void
    delete: (path: string, handler: any) => void
    post: (path: string, handler: any) => void
}