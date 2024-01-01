let fs = require("fs");

function parseValues(obj, propPath) {
    const props = propPath.split('.');
    let value = obj;
  
    for (const prop of props) {
      if (value && typeof value === 'object') {
        if (prop.includes('[') && prop.includes(']')) {
          // Dizi elemanlarına ulaşmak için
          const index = parseInt(prop.match(/\[(.*?)\]/)[1]);
          value = value[prop.split('[')[0]][index];
        } else {
          value = value[prop];
        }
      } else {
        return undefined;
      }
    }
  
    return value;
}

function removeCommentedThings(html){
    return html.replace(/<!--(.|\n)*?-->/, "")
}

function evaluateExpression(expression, data) {
    const operators = ['===', '!==', '==', '!=', '>', '<', '>=', '<='];
    if(/===|!==|==|!=|>|<|>=|<=/.test(expression)){
        for (const operator of operators) {
            if (expression.includes(operator)) {
                const [left, right] = expression.split(operator);
                const leftValue = parseValues(data, left.trim());
                let rightValue = right.trim();

                if(typeof leftValue === "string") {
                    rightValue = rightValue.replace(/"/g, "").replace(/'/g, "")
                }

                if(!isNaN(leftValue)){
                    rightValue = Number(rightValue);
                }
    
                switch (operator) {
                    case '===':
                        return leftValue === rightValue;
                    case '!==':
                        return leftValue !== rightValue;
                    case '==':
                        return leftValue == rightValue;
                    case '!=':
                        return leftValue != rightValue;
                    case '>':
                        return leftValue > rightValue;
                    case '<':
                        return leftValue < rightValue;
                    case '>=':
                        return leftValue >= rightValue;
                    case '<=':
                        return leftValue <= rightValue;
                    default:
                        return false;
                }
            }
        }
    } else {
        let value;

        if(expression.includes("'")){
            value = expression.trim().replaceAll("'", "");
        } else if(expression.includes('"')){
            value = expression.trim().replaceAll('"', "");
        } else if(!isNaN(Number(expression.trim()))){
            value = Number(expression)
        } else if(expression.trim() === "true") {
            value = true;
        } else if(expression.trim() === "false") {
            value = false;
        } else if (expression.trim() === "") {
            value = false;
        } else {
            value = parseValues(data, expression.trim());
        }
        
        return Boolean(value);
    }


    return false;
}

function ternaryCleanup(html){
    let splitTheHtml = html.split(" ");
    let statementsArray = [];
    let firstValue = [];

    for(let i = 0; i < splitTheHtml.length; i++){
        if(splitTheHtml[i] === "?"){
            for(let p = i - 1; p > -1; p--){
                statementsArray.push(splitTheHtml[p])
            }

            for(let z = i + 1; z < splitTheHtml.length; z++){
                firstValue.push(splitTheHtml[z]);
            }
        }
    }

    let reverseAndJoinTheStatementsArray = statementsArray.reverse().join(" ");
    let joinTheFirstValue = firstValue.join(" ");

    return [reverseAndJoinTheStatementsArray, joinTheFirstValue];
}

function templateTernaryStatements(html, data){
    let splitTheHtml = html.split(":");
    console.log("ternary fonksiyonunun içi!")

    for(let i = 0; i < splitTheHtml.length; i++){
        console.log("bölünen ilk html: ", splitTheHtml);
        let splitTheSplittedHtml = ternaryCleanup(splitTheHtml[i]);

        console.log("true splitting for html: ", splitTheSplittedHtml);

        let makeEvaluation = evaluateExpression(splitTheSplittedHtml[0], data);

        if(makeEvaluation) {
            return splitTheSplittedHtml[1];
        } else {
            if(!splitTheHtml[1].match(/\?\s*([^%]+)\s*:/g)){
                return splitTheHtml[1]
            }
        }
    }
}

function templateBasicStatements(html, data) {
    return html.replace(/{%\s*([^%]+)\s*%}/g, (ourMatch, variable) => {
        if(variable.match(/\?\s*([^%]+)\s*:/g)){
            console.log("Ternary ile eşleşti!");
            return templateTernaryStatements(variable, data)
        } else {
            const trimmedVariable = variable.trim();
            const value = parseValues(data, trimmedVariable);
            return value !== undefined ? value : ourMatch;
        }
    });
}

function templateIncludeStatements(html, data) {
    return html.replace(/{%\s*include\s*"([^"]+)"\s*%}/g, (match, variable) => {
        let getFile = fs.readFileSync(variable, "utf8");

        return getFile;
    })
}

function templateIfStatements(html, data) {
    return html.replace(/{%(\s*if\s*([^%]+))%}([^%]+){%(\s*endif\s*)%}/gs, (match, condition, v1, v2) => {      
        if(evaluateExpression(v1.trim(), data)){
            return v2
        } else {
            return ""
        }
    })
}

function templateIfElseStatements(html, data){
    return html.replace(/{%\s*if\s*([^%]+)\s*%}(.*?){%\s*else\s*%}(.*?){%\s*endifelse\s*%}/gs, (match, condition1, content1, content2, blabla) => {
        if(evaluateExpression(condition1, data)){
            return content1;
        } else {
            return content2;
        }
    })
}

function templateForLoops(html, loopData) {
    return html.replace(/{%\s*for\s*([^%]+),\s*([^%]+)\s*in\s*([^%]+)\s*%}(.*?){%\s*endfor\s*%}/gs, (match, v1, v2, v3, v4, v5, v6) => {
        let getArray = loopData[v3.trim()];

        let finalHtmlTemplate = "";

        if (Array.isArray(getArray)) {
            for (let i = 0; i < getArray.length; i++) {
                let getTemplateForNewTurn = v4;
                let stringForReplace = getTemplateForNewTurn;

                for (let [key, value] of Object.entries(getArray[i])) {
                    const repval = `${v2.trim()}.${key}`;
                    const replacementValue = value;

                    stringForReplace = stringForReplace.replace(`{% ${repval} %}`, replacementValue);
                }

                finalHtmlTemplate += stringForReplace;
            }
        } else {
            return null;
        }

        return finalHtmlTemplate;
    });
}

function template(html, data) {
    if(typeof data === "object"){
        let htmlData;

        if(html.match(/<!--(.|\n)*?-->/)){
            htmlData = removeCommentedThings(html);
        } else {
            htmlData = html
        }

        if(htmlData.match(/{%\s*include\s*"([^"]+)"\s*%}/g)){
            htmlData = templateIncludeStatements(htmlData, data)
        }

        if(htmlData.match(/{%\s*([^%]+)\s*%}/g)) {
            htmlData = templateBasicStatements(htmlData, data)
        }
        
        if(htmlData.match(/{%\s*if\s*([^%]+)\s*%}(.*?){%\s*endif\s*%}/gs)){
            htmlData = templateIfStatements(htmlData, data);
        }
        
        if(htmlData.match(/{%\s*for\s*([^%]+),\s*([^%]+)\s*in\s*([^%]+)\s*%}(.*?){%\s*endfor\s*%}/gs)){
            htmlData = templateForLoops(htmlData, data);
        }

        if(html.match(/{%\s*if\s*([^%]+)\s*%}(.*?){%\s*else\s*%}(.*?){%\s*endifelse\s*%}/gs)) {
            htmlData = templateIfElseStatements(htmlData, data);
        }

        return htmlData;
    } else {
        return null;
    };
};

function render(server, res, htmlfile, data = null) {
    fs.readFile(htmlfile, "utf8", (error, html) => {
        if (error) {
            res.setHeader("Content-Type", "text/plain")
            res.end(`Error: ${error}`);
        } else {
            let cachedPageFound = false;
            let cacheDisabledForRoute = false;
            let htmlForSend;

            if(server.cacheEnabled) {
                for(let disabledRoute of server.disabledRoutesforCache){
                    if(disabledRoute === server.currentPath){
                        cacheDisabledForRoute = true;
                    }
                }
            }

            if(server.cacheEnabled && !cacheDisabledForRoute){
                for (let cachedPage of server.cachedPages) {
                    if (cachedPage.path === server.currentPath) {
                        let now = new Date().getTime();
    
                        if ((now - cachedPage.timeSpan) <= server.cacheTimespan * 1000) {
                            htmlForSend = cachedPage.page;
                            cachedPageFound = true;
    
                            break;
                        }
    
                        if ((now - cachedPage.timeSpan) > server.cacheTimespan * 1000) {
                            htmlForSend = "";
                            server.cachedPages = server.cachedPages.filter(param => param.path === cachedPage.path);
                            break;
                        }
    
                    }
                }
            }


            if (!cachedPageFound) {
                let frontEnd = template(html, data);

                if(server.cacheEnabled && !cacheDisabledForRoute){
                    server.cachedPages.push({ page: frontEnd, timeSpan: new Date().getTime(), path: server.currentPath });
                }

                if (frontEnd) {
                    server.sendHtml(res, frontEnd);
                }
            } else {
                server.sendHtml(res, htmlForSend);
            }
        };
    });
};


function getCookieValue(req, cookieName){
    let cookieHeader = req.headers.cookie

    if(!cookieHeader || cookieHeader.length === 0 || !cookieName){
        return;
    }

    let splitCookies = cookieHeader.split("; ");

    let findTheExactCookie;

    for(let i = 0; i < splitCookies.length; i++){
        if(splitCookies[i].trim().startsWith(cookieName + "=")){
            findTheExactCookie = splitCookies[i].trim();
            break;
        };
    };
    

    if(!findTheExactCookie){
        return;
    }

    let getExactCookie = findTheExactCookie.split("=")[1];

    return getExactCookie
};

function setCookie(res, name, value, options){
    let cookieValue = `${name}=${value};`;

    if(Object.keys(options).length > 0) {
        for(let [key, value] of Object.entries(options)){
            let cookieSetting = `${key}=${value};`;
    
            cookieValue += cookieSetting;
        }
    }

    cookieValue = cookieValue.slice(0, -1);

    res.setHeader("Set-Cookie", cookieValue)
}

function redirect(res, path){
    res.statusCode = 302;
    res.setHeader("location", path);
    res.end()
}

function json(res, data){
    res.end(JSON.stringify(data));
};

class DdosProtector {
    constructor(){
        this.individualUsers = [{ ip: "999.999.999.999", count: 1,  }];
        this.attackTimespan = 30;
        this.attackCount = 20;
        this.banTime = 7200;
        this.bannedUsers = [];
        this.errorCode = 429;
    }

    init(options = null){
        if(options) {
            this.attackTimespan = options.timeAmount ? options.timeAmount : this.attackTimespan;
            this.attackCount = options.attackCount ? options.attackCount : this.attackCount;
            this.banTime = options.banTime ? options.banTime : this.banTime;
            this.errorCode = options.errorCode ? options.errorCode : this.errorCode;
        }

        return this;
    }

    handleBanningAndAllowing(req, res){
        let anyRepeatedAttack = false;
        let banEnded = false;
        let userWhichReAllowed = null;

        for(let i = 0; i < this.individualUsers.length; i++){
            if(this.individualUsers[i].isBanned){
                let now = new Date().getTime();

                if(now > this.individualUsers[i].dateToBeBanned){
                    this.individualUsers[i].isBanned = false;

                    banEnded = true;

                    userWhichReAllowed = this.individualUsers[i];
                } else {
                    this.banUser(req, res);
                }
            }
        }

        if(userWhichReAllowed){
            this.individualUsers = this.individualUsers.filter(param => param.ip !== userWhichReAllowed.ip)

            this.unBanUser(req, res, userWhichReAllowed.ip);
        }
        
        if(!banEnded){
            for(let i = 0; i < this.individualUsers.length; i++){
                if(this.individualUsers[i].ip === req.socket.remoteAddress){
                    if(!this.individualUsers[i].isBanned){
                        this.individualUsers[i].count = this.individualUsers[i].count + 1;
                    }
            
                    let now = new Date().getTime();
            
                    if(((this.individualUsers[i].count === this.attackCount) || 
                    (this.individualUsers[i].count > this.attackCount)) && 
                    (now - this.individualUsers[i].startTime) < (this.attackTimespan * 1000)){

                        this.individualUsers[i].isBanned = true;

                        this.individualUsers[i].count = 0;
    
                        this.individualUsers[i].dateToBeBanned = new Date().getTime() + (this.banTime * 1000);
        
                        this.banUser(req, res);
                    }
            
                    anyRepeatedAttack = true;
            
                    break;
                }
            }
        }
        
        if(!anyRepeatedAttack) {
            this.individualUsers.push({ ip: req.socket.remoteAddress, count: 1, startTime: new Date().getTime(), isBanned: false, dateToBeBanned: null });
        }

        return this;
    }

    banUser(req, res){
        res.statusCode = this.errorCode;
        res.setHeader("X-Ban-Reason", "Spamming")
    }

    unBanUser(req, res, userId){
        res.statusCode = 200;
        res.setHeader("X-Unban-User", userId)
    }

    logEverything(){
        console.log("attack count: ", this.attackCount);
        console.log("ban length: ", this.attackTimespan);
        console.log("exact banned time as second: ", this.banTime)
        console.log("individual users: ", this.individualUsers);
        console.log("banned users: ", this.bannedUsers);
        console.log("error code: ", this.errorCode);
    }
}

module.exports = {
    render,
    json,
    getCookieValue,
    setCookie,
    redirect,
    DdosProtector
}