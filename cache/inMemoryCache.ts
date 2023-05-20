type CachedItem<T> = {
    expiration: number;
    data: T;
}


export class InMemoryCache {

    private cache: Map<string, {expiration: number, data: any}>

    constructor(){
        this.cache = new Map()
    }

    get<T>(key: string): T | undefined{
      
        const cachedItem: CachedItem<T> = this.cache.get(key)
        if(cachedItem && cachedItem.expiration > Date.now()){
            return cachedItem.data
        }
        return undefined
    }

    set<T>(key: string, data: T,  expirationInSeconds: number){
        const expiration = Date.now() + expirationInSeconds * 1000;
        this.cache.set(key, {data, expiration})
    }
}