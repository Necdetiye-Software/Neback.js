# Neback.js - Easy, Flexible, Lightweight, Robust, All-In-One Web Framework for Node.js

Neback.js is brand new Backend framework for Javascript. It has express-like view, but has tons of built-in features which makes development process way more easier and also more fit to write clean and also, distributed code.

It has only 1 third party dependency, and that is formidable, which is used as form parser for forms that has "multipart/form data" value for "enctype" attribute. For now and if we don't absolutely need it we don't think to include another third party dependency, that will make our framework one of the most robust and also lightweight frameworks on Node.js.

Included Features: 

* Easy Routing(with `.get()`, `.post()` methods, or if you want you can use `.route()` method with also adding the method type.)
* Built-in View Engine(it's unfinished yet but ready for basic templating)
* Custom View Engine support
* Router Support
* Reaching form bodies directly from `req.body` object and form files directly from `req.files` object, no middleware needed.
* Route And Query Params are easier
* Middlewares with better behavior than express.js middlewares. 
* Built-in Sessions
* Dependency Injection Support
* Built-in flexible page caching for built-in view engine
* Built-in Ddos Protection Support

Planned Features:

* Adding Easy and customizable Cors Support
* Favicon
* Built-in Caching Support for Custom View Engines
* Built-in and easy websocket implementation.

Any suggestions about features for next versions of Neback.js are welcome.

# Documentation

### Initialization

For initalizing a Neback server, you need to import it via either Common.js or ES Modules:

```javascript

let { Neback } = require("neback-core.js");

let server = new Neback();

// your all other work

server.start(3000);

```

You can handle routes by that way:


```javascript

server.get("/", function(req, res){
    server.sendHtml(res, "<h2>Hello Everyone!</h2>")
});

server.route("get", "/about-us", function(req, res){
    server.sendHtml(res, "<h2>Here is About Us!</h2>");
});

```

### Built-in View Engine

We have a built-in view engine, and name is "Neview.js". It uses usual .html pages, it is more readable than ejs. Later we will also publish it with being a different package.

This view engine supports that features:

* including other files:

{% include "./folder/file.html" %}

* direct templating string, number and boolean variables:

{% ourVariable %}

* if statements supports evaluation of standalone statements:

{% if true %}
    <h2>Hello!</h2>
{% endif %}

* if statements which supports: '===', '!==', '==', '!=', '>', '<', '>=', '<=' comparisons:

{% if blabla > 10 %}
    <h2>Hello!</h2>
{% endif %}

* if/else statements also supports standalone statements:

{% if 0 %}
    <h2>Hello!</h2>
{% else %}
    <h2>Not Hello!</h2>
{% endifelse %}

* if/else statements which supports: '===', '!==', '==', '!=', '>', '<', '>=', '<=' comparisons:

{% if blabla > 10 %}
    <h2>Hello!</h2>
{% else %}
    <h2>Not Hello!</h2>
{% endifelse %}

* for loops:

{% for index, item in array %}
    <h2>Hello, {% item.name %}, you're the {% index %} student!</h2>
{% endfor %}

Planned features of that view engine as following:

* ternary support for direct templatings
* if/else if/else support
* support for "logical and" and "logical or" operators for both direct templatings and if/else if templates
* support for if, if/else and if/else if/else statements inside for loops
* support for if, if/else and if/else if/else statements one within each oter

Warning, according to my tests, it's slightly slower than ejs template engine. But if you use it with our built-in caching mechanism it's more faster. We'll describe how you can use it in next parts.

You can make renderings like that:

```javascript

// you have to require utils module of Neback.js:

let utils = require("neback-utils");

// for sake of platform agnosticism, i strongly recommend you to use ".join()" method of node.js's path modules when describing your pages place:

let path = require("path");

server.get("/contact", function(req, res){
    // first parameter makes that path finding to start on projects root folder,
    // the second and also all parameters that is not last one is folders to that file:
    // the last parameter is name of the file. This file belongs to "./pages/contact.html"
    // route.

    // you can use ".render()" function of neback-utils module for making templating with built-in view engine.

    // first parameter ise parameter of Neback instance.
    // second parameter is response object of the server.

    // third parameter is path of the file.
    
    let filePath = path.join(process.cwd(), "pages", "contact.html");

    // you can put datas if you want on last argument, it has to be object also:

    let data = "Hello from Neback.js!"

    utils.render(server, res, filePath, { data });
})

```

### Using Another View Engine

In Neback.js, we provide support for other view engines also. I currently only tried that feature with ejs and it worked very well.

```javascript

let server = new Neback();
let path = require("path");

// this will initialize ejs and it looks for .ejs files on "views" folder of current directory:

let ejs = server.customViewEngine("ejs", path.join(__dirname, "views"));

// and render a page like that:

server.get("/", function(req, res){
    // first parameter is response object
    // second parameter is template name without it's extension
    // and if you want to use data which you bring from server on that template, you can send it like it's third parameter. That parameter should be an object though

    let data = "Neback.js is awesome!";

    ejs.render(res, "index", { data })
})


```

### Router

In Neback.js, you can easily use routers and distribute your controllers to make your project more modular. Here is how it is:

```javascript

// this is your router:

let { Neback } = require("neback.js");

let adminPanelRoutes = new Neback();

adminPanelRoutes.get("/", function(req, res){
    // do your stuff
})

adminPanelRoutes.get("/users", function(req, res){
    // do your stuff
});

adminPanelRoutes.post("/add-user", function(req, res){
    // do your stuff
});

module.exports = {
    adminPanelRoutes
}

```


```javascript

// this is your main server

let { Neback } = require("neback.js");

let server = new Neback();

// your other codes here

// assuming your router file is in the "routers" folder and it's name is "admin-panel-router.js"

let { adminPanelRoutes } = require("./routers/admin-panel-router.js"); 

server.addRouter("/admin-panel", adminPanelRoutes);

// your other codes here

server.start(3000);

```

by writing that code, you added 3 new controllers which listens "/admin-panel/", "/admin-panel/users", "/admin-panel/add-user" in order.

### Reaching Request Body

In express and express based frameworks such as nest.js, you have to invoke some middlewares and even in some releases you have to use bodyParser package for reaching request bodies on your entire app. In Neback.js, there is no need for that, we have our own body parser for requests which means that if your request has either "application/json" or "application/x-www-form-urlencoded" values for "content-type" header(and for most of the cases if you making that requests via html forms or fetch api it will have ), you can reach your request body as simple as that:

```javascript

// you can reach form body with no prior code:

server.post("/", function(req, res){
    console.log(req.body);
});

```

Currently we don't support file handling, for that we gladly accept proper contributions.

### Route And Query Params

You can reach route parameters for that specific route via `req.params` object if there is any route parameter on this route.

```javascript

server.get("/blogs/:blogId", function(req, res){
    // you can reach that route parameter from this:

    console.log("blogId parameter: ", req.params.blogId)

    // your other stuff
})

server.get("/grades/:school/:year/:class/:student", function(req, res){
    // in this case, you have 4 route parameter and you can make your stuff depending on that parameter:

    console.log("route parameters: ", req.params.school, req.params.year, req.params.class, req.params.student);

    // your other stuff
})

```

And you can reach files from `req.files` object:

For example, lets we assume you have this form on your html page:

```html

    <form action="/blablabla" method="post" enctype="multipart/form-data">
        <input type="text" name="blabla" id="">
        <input type="text" name="otherOne" id="">
        <input type="file" name="ourfiles1" id="" multiple>
        <input type="file" name="ourfiles2" id="" multiple>
        <input type="submit" value="yolla">
    </form>

```

```javascript

server.post("/our-post-path", function(req, res){
    // which will look like that and with the inputs of course: { blabla: "your input", otherOne: "your input" }
    console.log("req.body object: ", req.body) 
    // and you can reach file inputs like this:
    console.log("ourfiles1 input: ", req.files.ourfiles1)
    console.log("ourfiles2 input: ", req.files.ourfiles2)

    // your other stuff
})

```

That file inputs are always arrays. That means you can apply them for, forEach loops or map functions whenever you want and you don't get error. If you don't provide any value for a file input, that input will have a value like that:

```javascript
        [{
            name: '',
            size: 0,
            tempPath: 'C:\\Users\\yourUser\\AppData\\Local\\Temp\\2d0daa63ef31c8e1bb8e02f01',
            type: 'application/octet-stream' // it'll have always that type for empty inputs.
        }]

```

If it's not empty, it'll have a value like that:

```javascript
    
    [    
        {
        name: 'your-image-1.png',
        size: 76042, 
        tempPath: 'C:\\Users\\yourUser\\AppData\\Local\\Temp\\8ec1abdd4cbb74d0e5b2b9900', 
        type: 'image/png'
        },
        {
        name: 'your-image-2.png',
        size: 77442,
        tempPath: 'C:\\Users\\necdet\\AppData\\Local\\Temp\\8ec1abdd4cbb74d0e5b2b9901',
        type: 'image/png'
        },
        {
        name: 'your-image-3.png',
        size: 77292,
        tempPath: 'C:\\Users\\necdet\\AppData\\Local\\Temp\\8ec1abdd4cbb74d0e5b2b9902',
        type: 'image/png'
        }
    ]

```

that datas means this:

name - The current name of that file when it's uploaded.
size - amount of bytes of that file
tempPath - an unique and temporary location for your file, which you can use it for reading and writing to somewhere in your project.
type - type of that file.

You can write that files like this:

```javascript

// you have to require fs module:

let fs = require("fs");

// and for this example, we use path module:

let path = reqiure("path");

// your other stuff

// lets assume we have a file input that has "pictures" name and it includes multiple files and we want to write all of them.
// we don't know which picture type of that but we want to obtain same file name:  

for(let i = 0; i < req.files.pictures.length; i++){
    let readFile = fs.readFileSync(req.files.pictures[i].tempPath, "binary");

    // we have to define where we put that file on that computer:

    // that path is basically means your "static" folder in the root directory:

    let filePath = path.join(process.cwd(), "static", req.files.pictures[i].name)

    // we write it:

    fs.writeFileSync(filePath, readFile, "binary");
}

```

Also if you have any query parameters on that route, you can reach it via `req.query` object. If there is no query parameters on that specific route, that object will have undefined value except an empty object, that means you can check existence of queries more easily.

```javascript

server.get("/search", function(req, res){
    // in this case, if there is no query parameter else block will work.

    if(req.query){
        // if there is one, you can reach it via like that:

        console.log("our name parameter: ", req.query.name);

        // do your other stuff
    } else {
        console.log("there is no query parameter")

        // do your other stuff
    }
});

```

### Middlewares

In Neback.js, middlewares are not blocking by default, which is the one of the best ways of that framework rather then express.js's middlewares. Because of that, there is no `next()` function on route handlers as argument. If you want to stop further code execution on your server via middlewares, you have to manually set it.

```javascript

// sample middleware

let { Neback } = require("neback-core.js");

let server = new Neback();

// your other stuff

server.middleware("/contact", function(req, res){
    console.log("Hello from a middleware!")
});

```

This middleware will be aplied for "/contact" and it's inner routes(for example, "/contact/blabla" is an inner route).

If you want to block further code execution on middlewares, you have to set response's http status code between 400 and 500, which means you have to return error code. 

This is also ideal behavior because it promotes you to use best practices.

This code will block further code execution on your server:

```javascript

// your other stuff

server.middleware("/", function(req, res){
    // do your stuff and set statusCode depending on them:
    res.statusCode = 403 // or any other error code, your custom codes included. It has to be less than 500 though.
})

```

And also you can return a response depending on code: 

```javascript

server.middleware("/", function(req, res){
    // in this example, we returned an error code for some reason:
    res.statusCode = 403;

    if(res.statusCode === 403){
        res.end("You're banned!");
    };
});

```

That code will make you return "You're banned!" response unless your returned status code not 403. If you want to continue further code execution, you have to give another status code either less than 400 or bigger than 499.

### Built-in Sessions

We have built-in and easy to use sessions, which you can simply start a new one and reach it anywhere on that server:

```javascript

server.post("/authenticate", function(req, res){
    // do your authentication checks

    // you can put any data type on that sessions but because in our case we have very basic authentication, we can put an user object:

    server.newSession("auth", { nickname: "necoo33", password: "yourPassword", email: "arda_etiman_799@windowslive.com" })

    // your other stuff
})

```

And reach it anywhere in your server:

```javascript

server.get("/", function(req, res){
    // we pick a session by the name which we gave it:

    let user = server.getSession("auth");

    console.log("our user: ", user);

    // your other stuff
})

```

And also you can delete it via the name which you gave it:

```javascript

// you can use it anywhere in your application:

server.deleteSession("auth");

```

### Dependency Injection

We also have dependency injection support, which saves you from initializing for example a database connection several times in your app and by that optimizes your code.

In this example, we'll make a sample database connection to MySql database:

```javascript

let { Neback } = require("neback-core");

// you also have to install third party dependency for that

let mysql = require("mysql2");

let mysql_pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "yourpassword",
    database: "yourdatabase"
}).promise();

server.addDependency("database", mysql_pool);

// your other stuff

// Whenever you want to user dependency on a route, you have to add a third parameter to route handlers:

server.get("/get-users", async function(req, res, dependencies){
    // we pick our dependency by the name which we gave it, just like in sessions:

    let mysql = dependencies.database;

    let getAllUsers = await mysql.execute("SELECT * FROM table_name");

    let actualUsers = getAllUsers[0];

    // your other stuff
})

```

### Built-in Caching

In Neback.js, we provide caching mechanism for our built-in view engine, which can be enabled like this:

```javascript

let { Neback } = require("neback-core");

let server = new Neback();

// your other stuff

// and we write that method with the parameter which means how many seconds we want to cache that pages:

server.enableCache(50)

```

If you want to disable some pages from cache, you can basically append following method to that expression: `.disableCacheForRoute("/")`. You have to put the path of the route that page will be served. You can chain every path that you want to disable for caching:

```javascript

server.enableCache(50).disableCacheForRoute("/not-cached")

```

You can either use `sendHtmlWithCache()` function for sending html directly from server:

```javascript

server.get("/", function(req, res){
    server.sendHtmlWithCache(res, "<h2>Hello</h2>");
})

```

Or you can use `.render()` function and framework will automatically detect if caching is enabled and if it's enabled and not disabled for that specific route it'll cache that page:

```javascript

// you have to require utils package:

let utils = require("neback-utils");

server.get("/", function(req, res){
    utils.render(server, res, "./index.html")
})

```
### Ddos Protector

In Neback.js, we provide you a highly customizable Ddos Protector. You can set the rules or you can use it with default rules(which we don't recommend, because it could not fit to your specific use case), and it'll return you an error code which also you can customize, and you have to handle it. And remember, if you return a status code which between 399 and 500, that middlewares will be blocking and not let you further code execution, which suits very well to our middlewares. It also works on express.js and we'll give an example about that:

this is an example for Neback.js:

```javascript

let { Neback } = require("neback-core");

// you have to import it from neback-utils package:

let { DdosProtector } = require("neback-utils");

// that's your options, you can customize protector with that object, this are the default values:

let options = {
    attackTimespan: 30 // it's how much time that you want to ban ip if that ip makes too many request.
    attackCount: 5 // it's how many request to ban it if an ip makes that amount of request to the server.
    banTime: 7200 // it's how many seconds do you want to ban an attacker.
    errorCode: 429 // it's which error code do you want to return if an attacker detected.   
}

let ddosProtector = new DdosProtector().init(options);

// your other stuff

// you can handle it in a middleware like this:

server.middleware("/", function(req, res){
    // also you can log if you want to track anything:
    ddosProtector.handleBanningAndAllowing(req, res).logEverything();

    // then we recommend handle that route like that:

    if(res.statusCode === 429) {
        res.end("429 too many requests");
    }

    // since our middlewares are not blocking 
})

```

And this is an example for express.js:

```javascript

// initializa an express server:
let server = require("express")();

// import that ddos protector from our utility module:

let { DdosProtector } = require("neback-utils");

let options = {
    // define your options here
}

let ddosProtector = new DdosProtector().init(options);

// and handle it like that:

server.use("/", function(req, res, next){
    ddosProtector.handleBanningAndAllowing(req, res);

    // if you want, you can listen any error message and set any error message, here is an example for that:

    if(res.statusCode >= 400 && res.statusCode < 500){
        return res.end("error")
    } else {
        return next();
    }
});

```

# Stability

When i develop Neback.js, i tested every feature for as many specific cases as i can, but since there is no website that developed that framework, we aren't sure features are stable. But in my opinion, except cache and ddos protector api, all api's are quite stable. Since that api's more new to me, there can be some bugs on them. Use carefully that api's for now.