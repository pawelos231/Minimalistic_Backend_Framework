# API for Arkanoid Game with custom framework

<p align='center'>
<br>
<i><b>[🚧 Work in progress! 🚧]</b></i>
</p>

Backend for my Arkanoid game written in pure node.js that i built framework upon, the main idea for creating this small framework was to avoid overhead that frameworks like [epxress](https://expressjs.com/en/api.html) provides, it was also a very nice learning experience, framework supports all the main features like: request handling, middleware, dynamic routes.

## Reference

To create api route with handler and some controller level middleware you would need to create an instance of the server that file server.ts provides, here is a simple exapmle:

```typescript
const app: Server<Function> = initServer();

const auth2 = (req: any, res: http.ServerResponse): void => {
  req.example = "example";
  console.log("middleware");
};

app.get(
  "/someRoute/:id",
  function (req, res: http.ServerResponse) {
    console.log("controller");
  },
  [auth]
);
```

server can also serve static files (the default value for path is public)

## About game

Due to the fact that this framework was mainly created for one of my games, it probably will be extracted to different repository in the future
