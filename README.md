# Custom Framework with API for arkanoid game

<p align='center'>
<br>
<i><b>[🚧 Work in progress! 🚧]</b></i>
</p>

The documentation that is presented here offers a comprehensive and elaborate explanation of a custom framework that has been specifically built on top of the Node.js platform. This framework has been designed to provide developers with a powerful and flexible set of tools and functionalities, which can be leveraged for the development of a diverse range of web applications.

## Reference

The custom framework that has been developed on top of Node.js provides developers with a powerful and flexible set of tools and functionalities, including support for both controller-level and application-level middleware.

When using this framework, developers can choose between two different types of middleware: controller-level and application-level middleware. Controller-level middleware is executed only on a specific route that is bound to the middleware, whereas application-level middleware is executed on every incoming request, regardless of the path.

To implement controller-level middleware in this framework, developers must pass a function as a parameter, which has access to the req and res objects. This function can then perform specific tasks or add custom logic to the request/response flow, such as authentication, data validation, or error handling, among other things.

On the other hand, application-level middleware can be useful for implementing more general functionality that needs to be applied to every incoming request. For example, it can be used to perform CORS handling, set headers, or parse request bodies, among other things.

```typescript
const GET_STATS = "/getStats";
const POST_STATS = "/postStats";
const GET_LEVELS = "/getLevelData";

const app: Server = new Server();

app.use((req: any, res: http.ServerResponse, next: Function) => {
  AllowCors(res);
  next();
});

/*example middleware auth function */
const auth2 = (req: any, res: http.ServerResponse): void => {
  req.example = "example";
};

app.get(GET_STATS, getStatsData, [auth2]);
app.get(GET_LEVELS, getLevelData);
app.post(POST_STATS, sendStatsData);
```

The framework also provides functionality for serving static files. The default location to look for static files is in the "public" folder. When using the framework, users have the option to resize or compress images using multiple threads based on their preferences.

## About game

The Arkanoid game was the primary motivation behind creating this framework, and it may be extracted into a separate repository in the future. The primary goal of this project was to gain a deeper understanding of Node.js and explore more advanced and hidden usages of the platform.

## Why ?

The primary objective of creating this framework was to gain a deeper understanding of Node.js and explore its advanced and lesser-known capabilities. By building a custom framework, I was able to gain more control over the platform, avoid the overhead of existing frameworks, and experiment with more advanced features.

Creating a custom framework allowed me to experiment with more advanced features of Node.js, such as optimizing performance, improving scalability, and implementing new functionality. It also gave me the opportunity to learn more about how Node.js works under the hood, and to gain a deeper understanding of its core concepts and principles.
