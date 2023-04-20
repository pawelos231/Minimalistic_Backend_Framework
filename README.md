# Custom Framework with API for arkanoid game

<p align='center'>
<br>
<i><b>[🚧 Work in progress! 🚧]</b></i>
</p>

Backend for my Arkanoid game written in pure node.js that i built framework upon, the main idea for creating this small framework was to avoid overhead that frameworks like [epxress](https://expressjs.com/en/api.html) provides, it was also a very nice learning experience, framework supports all the main features like: request handling, middleware, dynamic routes.

## Reference

Framework allows you to create both controller level and application level middleware where middleware functions are executed on every request regardless of their paths. To pass controller level middleware you have to pass a function that has req nad res objects as parameters, controller level middleware happens on specific route bound to to this middleware, bellow you can see basic example the basic usage of the framework.

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

server can also serve images and basic static files (the default value for path to look for static files is public), images can be resized and compressed, which happens on multiple threads, 

## About game

Due to the fact that this framework was mainly created for one of my games, it probably will be extracted to different repository in the future

## Why ?

I wanted to implement my own framework to give myself better insight of more advanced and "hidden" usages of node. Because this projects was created mainly for learning purposes, it can and likely will change over the time.


