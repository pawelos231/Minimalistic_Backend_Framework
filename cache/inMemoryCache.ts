type CachedItem<T> = {
    expiration: number;
    data: T;
}


export class InMemoryCache {

    private cache: Map<string, CachedItem<any>>

    constructor(){
        this.cache = new Map()
    }

    get<T>(key: string): T | undefined{    
        const cachedItem: CachedItem<T> | undefined = this.cache.get(key)

        if(cachedItem && cachedItem.expiration > Date.now()){
            return cachedItem.data
        }
        return undefined
    }

    set<T>(key: string, data: T,  expirationInSeconds: number){

        const expiration = Date.now() + expirationInSeconds * 1000;
        const cachedItem: CachedItem<T> = { data, expiration };
        this.cache.set(key, cachedItem)

    }
    delete(key: string): void {
        this.cache.delete(key);
    }
    
    clear(): void {
        this.cache.clear();
    }
}