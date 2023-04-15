# Custom Framework with API for arkanoid game

<p align='center'>
<br>
<i><b>[🚧 Work in progress! 🚧]</b></i>
</p>

Backend for my Arkanoid game written in pure node.js that i built framework upon, the main idea for creating this small framework was to avoid overhead that frameworks like [epxress](https://expressjs.com/en/api.html) provides, it was also a very nice learning experience, framework supports all the main features like: request handling, middleware, dynamic routes.

## Reference

To create api route with handler and some controller and router level middleware you would need to create an instance of the server that file server.ts provides, here is a simple exapmle:

```typescript
const ServerInstance: Server = new Server();

ServerInstance.use((req: any, res: http.ServerResponse, next: Function) => {
  AllowCors(res);
  next();
});

const app: MethodsHandler = ServerInstance.initServer();

const auth2 = (req: any, res: http.ServerResponse): void => {
  req.example = "example";
};

app.get(GET_STATS, getStatsData, [auth2]);
app.get(GET_LEVELS, getLevelData);
app.post(POST_STATS, sendStatsData);
```

server can also serve images and basic static files (the default value for path to look for static files is public), images can be resized and compressed, which happens on multiple threads

## About game

Due to the fact that this framework was mainly created for one of my games, it probably will be extracted to different repository in the future
