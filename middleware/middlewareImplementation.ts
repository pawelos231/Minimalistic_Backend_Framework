const processMiddleware = (middleware, req, res) => {
    if (!middleware) {
        return new Promise((resolve) => resolve(true));
    }
    return new Promise((resolve) => {
        middleware(req, res, function () {
            resolve(true)
        })
    })
}

