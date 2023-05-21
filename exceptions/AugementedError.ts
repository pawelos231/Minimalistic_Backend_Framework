class FancyError extends Error {
    constructor(args){
        super(args)
        this.name = "fancy error"
    }
}