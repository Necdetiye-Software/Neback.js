let http = require("http");
let url = require("url");
let path = require("path");
let { formidable } = require("formidable");

// dependency injection yapma kabiliyetini ekle.
class Neback {
    constructor(){
        this.routes = [];
        this.sessions = {};
        this.middlewares = [];
        this.dependencies = {};
        this.views = null;
        this.currentPath = null;
        this.disabledRoutesforCache = null;
        this.cacheEnabled = false;
    }

    newSession(name, data){
        this.sessions[name] = data;

        return this;
    }

    getSession(name){
        return this.sessions[name];
    }

    deleteSession(name){
        this.sessions[name] = undefined;

        return this;
    }

    route(method, path, handler){
        this.routes.push({ method, path, handler});

        return this;
    };

    get(path, handler){
        this.routes.push({ method: "get", path, handler });

        return this;
    };

    post(path, handler){
        this.routes.push({ method: "post", path, handler });

        return this;
    };

    put(path, handler){
        this.routes.push({ method: "put", path, handler });

        return this;
    };

    delete(path, handler){
        this.routes.push({ method: "delete", path, handler });

        return this;
    };

    patch(path, handler){
        this.routes.push({ method: "patch", path, handler });

        return this;
    };

    addRouter(innerRoute){
        for(let i = 0; i < innerRoute.routes.length; i++){
            this.routes.push(innerRoute.routes[i]);
        };

        return this;
    };

    async handleRequest(req, res){
        let matchedRoute;

        for(let i = 0; i < this.routes.length; i++){
            let path = url.parse(req.url, true);

            req.params = {};

            let actualRoutePath = "";

            if(this.routes[i].path.includes(":")){
                let splitTheRoutesPath = this.routes[i].path.split("/");

                for(let p = 0; p < splitTheRoutesPath.length; p++){
                    let newSplittedPath = path.pathname.split("/")[p];
                    let currentSplitTheRoutesPath = splitTheRoutesPath[p];

                    if(currentSplitTheRoutesPath.includes(":")){
                        req.params[currentSplitTheRoutesPath.trim().replace(":", "")] = newSplittedPath;
                        
                        if(p !== 0){
                            actualRoutePath += "/";
                        }
                        
                        actualRoutePath += newSplittedPath;
                    } else{
                        if(p !== 0) {
                            actualRoutePath += "/";
                        }

                        actualRoutePath += newSplittedPath
                    }
                }
            }

            let urlQueries = path.query;

            if(Object.keys(urlQueries).length !== 0){
                let queryObj = {};

                Object.assign(queryObj, urlQueries);

                req.query = queryObj;
            }

            if(actualRoutePath === ""){
                actualRoutePath = this.routes[i].path;
            }

            if(this.routes[i].method === req.method.toLowerCase() && actualRoutePath === path.pathname){
                matchedRoute = this.routes[i];

                break;
            }
        };

        let dependencies;

        if(Object.keys(this.dependencies).length === 0) {
            dependencies = null;
        } else {
            dependencies = this.dependencies
        }

        req["body"] = {};

        if(matchedRoute){
            for(let i = 0; i < this.middlewares.length; i++){
                if(matchedRoute.path.startsWith(this.middlewares[i].path)){
                    this.runMiddlewares(req, res, dependencies);
                }
            }

            this.currentPath = matchedRoute.path;

            await this.findBody(req);

            if(res.statusCode < 400 || res.statusCode > 500){
                matchedRoute.handler(req, res, dependencies)
            }
        } else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
        }
    }

    async findBody(req){
        let body = "";

        await req.on("data", function(chunk){
            body += chunk
        });

        let contentType = req.headers["content-type"];

        if(contentType === "application/json"){
            let jsonizedData = JSON.parse(body)
            
            for(let [key, value] of Object.entries(jsonizedData)){
                req.body[key] = value;
            };
        }

        if(contentType === "application/x-www-form-urlencoded"){
            let parsedData = queryString.parse(body);

            for(let [key, value] of Object.entries(parsedData)){
                req.body[key] = value;
            }
        }

        if(contentType && contentType.includes("multipart/form-data")){
            let form = formidable({ maxFiles: 100, maxFileSize: 50000000000, maxTotalFileSize: 50000000000, allowEmptyFiles: true, minFileSize: 0 });

            let files;
            let fields;

            [fields, files] = await form.parse(req);
            
            req.files = {};

            for(let [key, value] of Object.entries(files)){
                req.files[key] = [];
                for(let i = 0; i < value.length; i++){
                    let newObj = {
                        name: value[i].originalFilename,
                        size: value[i].size,
                        tempPath: value[i].filepath,
                        type: value[i].mimetype
                    }

                    req.files[key].push(newObj);
                }
            }

            for(let [key, value] of Object.entries(fields)){
                req.body[key] = value;
            }
        }
    }

    runMiddlewares(req, res, dependencies = this.dependencies){
        for(let i = 0; i < this.middlewares.length; i++){
            this.middlewares[i].handler(req, res, dependencies);
        }
    }

    middleware(path, mw){
        this.middlewares.push({ path, handler: mw });
    }

    addDependency(name, data) {
        this.dependencies[name] = data;

        return this;
    }

    start(port, callback){
        http.createServer(function(req, res){
            this.handleRequest(req, res);
        }.bind(this)).listen(port, callback);
    };

    customViewEngine(engine, folder){
        return new CustomTemplateEngine(engine, folder).init();
    }

    sendHtml(res, sendedThing){
        if(res.statusCode >= 400 && res.statusCode <= 500){
            res.end("403 Forbidden");
        } else {
            res.setHeader("Content-Type", "text/html");
            res.end(sendedThing);
        };
    };

    enableCache(cacheTimeSpan = null){
        this.cachedPages = [{ page: "sfsdfsd", timespan: 2342, path: "asfsdf" }];
        this.currentPath = "";
        this.disabledRoutesforCache = ["sdgdgsdsdgdsfgfdh"];
        this.cacheEnabled = true;
        
        if(cacheTimeSpan && !isNaN(Number(cacheTimeSpan))){
            this.cacheTimespan = cacheTimeSpan;
        } else {
            this.cacheTimespan = 30;
        }

        return this;
    }

    disableCacheForRoute(route){
        this.disabledRoutesforCache.push(route);

        return this;
    }

    sendHtmlWithCache(res, sendedThing){
        let htmlForSend = "";

        if(!this.cachedPages){
            throw new Error("you should enable caching before use html page caching.")
        }

        if(res.statusCode >= 400 && res.statusCode <= 500){
            res.end("403 Forbidden");
        } else {
            res.setHeader("Content-Type", "text/html");

            let cacheDisabled = false;

            for(let i = 0; i < this.disabledRoutesforCache.length; i++){
                if(this.disabledRoutesforCache[i] === this.currentPath){
                    cacheDisabled = true;
                }
            }
            
            if(!cacheDisabled){
                for(let i = 0; i < this.cachedPages.length; i++){
                    let now = new Date().getTime();
    
                    if(this.cachedPages[i].path === this.currentPath){
                        if(((now - this.cachedPages[i].timeSpan) <= this.cacheTimespan * 1000)){
                            htmlForSend = this.cachedPages[i].page;
                            break;
                        }
    
                        if(((now - this.cachedPages[i].timeSpan) > this.cacheTimespan * 1000)){
                            htmlForSend = "";
                            this.cachedPages = this.cachedPages.filter(param => param.path === this.cachedPages[i].path);
                            break;
                        }
                    }
                }
            }


            if(htmlForSend === ""){
                if(!cacheDisabled){
                    this.cachedPages.push({ page: sendedThing, timeSpan: new Date().getTime(), path: this.currentPath });
                }

                htmlForSend = sendedThing;
            }

            
            res.end(htmlForSend);
        };
    }
}

class CustomTemplateEngine {
    constructor(engine, folder) {
        this.engine = engine;
        this.folder = folder;
    }
    
    init() {
        const viewEngine = require(this.engine);
  
        this.viewEngine = viewEngine;

        return this;
    }

    render(res, file, data){
        let viewPath;

        switch(this.engine) {
            case "ejs": viewPath = path.join(this.folder, file + '.ejs');
                break;
            case "pug": viewPath = path.join(this.folder, file + '.pug');
                break;
            case "handlebars": viewPath = path.join(this.folder, file + '.hbs');
                break;
        }

        this.viewEngine.renderFile(viewPath, data, function(err, html){
            if (err) {
              res.writeHead(500, { 'Content-Type': 'text/plain' });
              res.end('Custom View engine error: ' + err.message);
            } else {
              res.writeHead(200, { 'Content-Type': 'text/html' });
              res.end(html);
            }
        });
    }
}

module.exports = {
    Neback
}