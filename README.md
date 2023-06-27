# Custom Framework with API for arkanoid game

<p align='center'>
<br>
<i><b>[🚧 framework will receive updates in the future depending on the additional functionalities i would like to implement 🚧]</b></i>
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

/*example middleware function */
const auth2 = (req: any, res: http.ServerResponse): void => {
  req.example = "example";
};

app.get(GET_STATS, getStatsData, [auth2, auth2]);
app.get(GET_LEVELS, getLevelData);
app.post(POST_STATS, sendStatsData);
```

The framework also provides functionality for serving static files. The default location to look for static files is in the "public" folder. When using the framework, users have the option to resize or compress images using multiple threads based on their preferences.

## Options

Options provide a way to customize the behavior of a server during its creation. When setting up a server, you have the flexibility to pass various options that tailor its usage according to your specific requirements. However, if no options are explicitly provided, the server will automatically employ a set of default options. These default options ensure that the server operates with predefined settings.

In the given TypeScript code snippet, the DEFAULT_OPTIONS object represents the default configuration for the server. It includes several properties that determine its behavior.

```typescript
DEFAULT_OPTIONS = {
  compressImages: true,
  cacheStatic: true,
  staticFileCacheTime: 60, //cache time in seconds
  serverName: "nice server",
  rootDirectory: "/public",
  port: 3002,
};
```

The compressImages property, when set to true, enables image compression functionality within the server. This feature reduces the file size of images to optimize transmission and storage.

The cacheStatic property, when set to true, enables static file caching. Static files, such as HTML, CSS, and JavaScript files, are stored in a cache to enhance performance and reduce server load.

The staticFileCacheTime property represents the duration, in seconds, for which the static files will be cached. After this time period elapses, the server will re-fetch the static files from the source.

The serverName property defines the name or identifier associated with the server. In this case, it is set as "nice server", but you can customize it as per your preference.

The rootDirectory property specifies the root directory from which the server will serve files. The "/public" path indicates that the server will retrieve files from the "public" directory.

The port property determines the network port number on which the server will listen for incoming requests. The default port specified here is 3002, but you can change it to any available port based on your needs.

## About game

The Arkanoid game was the primary motivation behind creating this framework, and it may be extracted into a separate repository in the future. The primary goal of this project was to gain a deeper understanding of Node.js and explore more advanced and hidden usages of the platform.

## Why ?

The primary objective of creating this framework was to gain a deeper understanding of Node.js and explore its advanced and lesser-known capabilities. By building a custom framework, I was able to gain more control over the platform, avoid the overhead of existing frameworks, and experiment with more advanced features.

Creating a custom framework allowed me to experiment with more advanced features of Node.js, such as optimizing performance, improving scalability, and implementing new functionality. It also gave me the opportunity to learn more about how Node.js works under the hood, and to gain a deeper understanding of its core concepts and principles.
