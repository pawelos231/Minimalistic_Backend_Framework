# API for Arkanoid Game with custom framework

Backend for my Arkanoid game written in pure node.js that i built framework upon, the main idead for creating this small framework was to avoid overhead that frameworks like [epxress](https://expressjs.com/en/api.html) provides, it was also a very nice learning experience, framework supports all the main features like: simple request handling, middleware, dynamic routes.

## Reference
To create api route with handler and some middleware you would need to create an instance of the server that file server.ts provides, here is a simple exapmle:

```typescript
 const app: Server<Function & any> = initServer()
    
    const auth2 = (req: any, res: http.ServerResponse) => {
    req.example = "example"
    console.log("middleware")
    }
    app.get("/someRoute/:id", function(req, res) {
        console.log("controller")
    }, [auth])
```

## About game
Due to the fact that this framework was mainly created for one of my games, here are some technologies that i used alongside my framework to communicate with my client Arkanoid game:
- typescript
- sql database

For authorization i used my own solution instead of relying on providers

If you want to contribute, just do pull request