'use strict';

window.colossus = {};
let require, define;
(function () {
    /**
     * DOM ready方法
     * @param callback
     * @return {boolean}
     */
    const documentReady = function(callback) {
        let result = document.readyState === "complete" || (document.readyState !== "loading" && !document.documentElement.doScroll);
        if (callback) {
            if (result)
                callback();
            else {
                document.addEventListener("DOMContentLoaded", callback);
            }
        } else {
            return result;
        }
    };

    const hasProp = function(obj, prop) {
        return Object.prototype.hasOwnProperty.call(obj, prop);
    };

    /**
     * 对象key遍历方法
     * @param obj
     * @param func
     */
    const eachProp = function(obj, func) {
        let prop;
        for (prop in obj) {
            if (hasProp(obj, prop)) {
                if (func(obj[prop], prop)) {
                    break;
                }
            }
        }
    };

    let colossus = {};
    let commentRegExp = /\/\*[\s\S]*?\*\/|([^:"'=]|^)\/\/.*$/mg,
        cjsRequireRegExp = /[^.]\s*require\s*\(\s*["']([^'"\s]+)["']\s*\)/g,
        isBrowser = !!(typeof window !== 'undefined' && typeof navigator !== 'undefined' && window.document),
        readyRegExp = isBrowser && navigator.platform === 'PLAYSTATION 3' ? /^complete$/ : /^(complete|loaded)$/,
        dataMain,
        head = document.getElementsByTagName('head')[0],
        cfg = {
            paths: {}
        },
        router = {
            'home': {
                address: './js/model/home',
                renderer: 'main'
            }
        },
        map = {},
        plus = {};

    /**
     * 设置默认配置
     * @param obj
     */
    colossus.config = function (obj){
        let allow = {
            paths: true
        };

        eachProp(obj, (value, prop) => {
            if (allow[prop]) {
                if (!cfg[prop]) {
                    cfg[prop] = {};
                }
                colossus.tool.extend(cfg[prop], value, true);
            }
        });
    };

    /**
     * 设置路由
     * @param data
     */
    colossus.route = function (data) {
        if (!!data && !colossus.tool.isArray(data) && !colossus.tool.isFunction(data) && !(data instanceof RegExp)) {
            colossus.tool.extend(router, data);
        } else {
            console.error('路由设置错误, %s', data);
        }
    };

    /**
     * ajax请求模块
     * @param options
     * @return {Promise}
     */
    colossus.send = function (options) {
        let type = options.type || 'GET';
        let url = options.url;
        if (!url)
            return console.error('请求地址不能为空');

        let data = options.data;
        if (!!data && !colossus.tool.isArray(data) && !colossus.tool.isFunction(data) && !(data instanceof RegExp)) {
            if (type === 'GET') {
                let str = '';
                eachProp(data, function (val, key) {
                    str += ('&' + key + '=' + val);
                });
                data = str.slice(1);
            }
        } else if (!!data) {
            return console.error('请求参数 data %s 格式不合法', data);
        }

        let dataType = options.dataType || 'text';
        let xhr = new XMLHttpRequest();
        if (type === 'POST' || type === 'post') {
            xhr.open(type, url, true);
            xhr.setRequestHeader("content-type", "application/x-www-form-urlencoded");
            xhr.send(data);
        } else if (type === 'GET' || type === 'get') {
            if (!!data)
                url += '?' + data;
            xhr.open(type, url, true);
            xhr.send();
        }

        return new Promise((resolve, reject) => {
            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        if (dataType === "json" || dataType === "JSON") {
                            resolve(JSON.parse(xhr.responseText))
                        } else {
                            resolve(xhr.responseText);
                        }
                    } else {
                        reject(xhr);
                    }
                }
            }
        })
    };

    /**
     * 代理模块
     */
    colossus.delegate = {
        /**
         * @description 监听器存取对象
         * @type {object}
         * @private
         */
        _listeners: {},
        add(type, listener, target) {
            if (this._listeners === undefined)
                this._listeners = {};

            let listeners = this._listeners;
            if (listeners[type] === undefined)
                listeners[type] = [];

            if (!this._hasDelegate(type, listener, target))
                listeners[type].push({callback: listener, eventTarget: target});
        },
        dispatch(event, eventData, clearAfterDispatch) {
            if (this._listeners === undefined)
                return;

            let listeners = this._listeners;
            let listenerArray = listeners[event];

            if (listenerArray !== undefined) {

                if (!eventData)
                    eventData = null;

                let array = [];
                let length = listenerArray.length;

                for (let i = 0; i < length; i++) {
                    array[i] = listenerArray[i];
                }

                for (let i = 0; i < length; i++) {
                    array[i].callback.call(array[i].eventTarget, eventData);
                }

                if (!!clearAfterDispatch)
                    listenerArray.length = 0;
            }
        },
        _hasDelegate(type, listener, target) {
            if (this._listeners === undefined)
                return false;

            let listeners = this._listeners;
            if (listeners[type] !== undefined) {
                for (let i = 0, len = listeners[type].length; i < len; i++) {
                    let selListener = listeners[type][i];
                    if (selListener.callback === listener && selListener.eventTarget === target)
                        return true;
                }
            }
            return false;
        },
        cleanDelegate(target) {
            if (this._listeners === undefined)
                return;

            let listeners = this._listeners;
            for (let key in listeners) {
                let listenerArray = listeners[key];

                if (listenerArray !== undefined) {
                    for (let i = 0; i < listenerArray.length;) {
                        let selListener = listenerArray[i];
                        if (selListener.eventTarget === target)
                            listenerArray.splice(i, 1);
                        else
                            i++
                    }
                }
            }
        },
        removeDelegate(type, target) {
            if (this._listeners === undefined)
                return;

            let listeners = this._listeners;
            let listenerArray = listeners[type];

            if (listenerArray !== undefined) {
                for (let i = 0; i < listenerArray.length;) {
                    let selListener = listenerArray[i];
                    if (selListener.eventTarget === target)
                        listenerArray.splice(i, 1);
                    else
                        i++
                }
            }
        }
    };

    colossus.tool = {
        extend(target, source, deep) {
            if (source) {
                let prop, value;
                for (prop in source) {
                    value = source[prop];
                    if (deep && value && typeof value === 'object' && !colossus.tool.isArray(value) && !colossus.tool.isFunction(value) && !(value instanceof RegExp)) {
                        if (!target[prop])
                            target[prop] = {};

                        colossus.tool.extend(target[prop], value, deep);
                    } else {
                        target[prop] = value;
                    }
                }
            }
            return target;
        },
        isArray(it) {
            return Object.prototype.toString.call(it) === '[object Array]';
        },
        isFunction(it) {
            return Object.prototype.toString.call(it) === '[object Function]';
        },
    };

    /**
     * 浏览器模块
     */
    colossus.browser = {
        address: {
            old: null,
            current: null,
            search: null
        },
        history: [],
        loadHistory() {
            this.history.push(this.address.current);
        },
        back() {
            if (!!this.address.old && this.history.length >= 1) {
                this.address.current = this.address.old;
                this.address.old = null;
                window.history.back();
            } else {
                location.hash = '';
            }
        },
        load(newUrl, oldUrl) {
            this.address.current = newUrl;
            this.address.old = oldUrl;
        }
    };

    /**
     * hashchange监听
     */
    window.addEventListener('hashchange', (event) => {
        _processURL(event);
        _processSearch();
        _analyzeURL();
    }, false);

    //todo 路由解析- (写入临时解析结果   url search)
    //todo 无路由回退-    特殊回退( 无old to home 有old history.back() )

    //todo 路由流
    //todo 设置流回转url

    //todo 路由写入
    //todo 路由渲染

    /**
     * process url from hash
     * @param event
     * @private
     */
    function _processURL(event) {
        if (!!event) {
            colossus.browser.load(event.newURL.split('#')[1] || 'home', event.oldURL.split('#')[1] || 'home');
        } else {
            if (location.hash === '') {
                colossus.browser.address.current = 'home';
            } else {
                colossus.browser.address.current = location.hash.split('#')[1];
            }
        }
        colossus.browser.loadHistory();
    }

    /**
     * process search key from current
     * @private
     */
    function _processSearch() {
        let search = {};
        let c = this.browser.address.current;
        c = c.split('?');
        if (c.length > 1) {
            c = c[1].split('&');
            for (let i = 0, len = c.length; i < len; i++) {
                let key = c[i].split('=');
                search[key[0]] = key[1];
            }
        }
        address.search = search;
        address.current = address.current.split('?')[0];
    }

    /**
     * analyze url from route
     * @private
     */
    function _analyzeURL() {
        let url = address.current.split('?')[0];
        if (!!router[url]) {
            let html = router[url].address + '.html';
            if (!!map[url]) {
                _renderer(url)
            } else {
                colossus.send({
                    url: html
                }).then((text) => {
                    map[url] = text;
                    _renderer(url)
                })
            }
        } else {
            colossus.browser.back();
        }
    }

    /**
     * render page
     * @param url
     * @private
     */
    function _renderer(url) {

    }


    let module = function (dependency, callback) {
        this.dependency = dependency;
        this.ready = false;
        this.callback = callback;
        this.func = null;
        if (this.dependency === null) {
            this.ready = true;
            this.func = this.callback()
        }
    };

    let req = {
        module: {},
        requireSequence: [],
        defined: [],
        loadSequence: {},
        checkDependency(dependencies) {
            if (typeof dependencies === 'string') {
                dependencies = [dependencies]
            }

            if (dependencies instanceof Array) {
                return dependencies.every(function (t) {
                    return this.module[t] && this.module[t].ready
                }.bind(this))
            } else {
                return console.error('depend %s is incorrect', dependencies);
            }
        },
        getDependency(dependencies) {
            return dependencies.map(function (t) {
                return this.module[t].func;
            }.bind(this))
        },
        load(moduleName, url) {
            if (this.loadSequence[moduleName])
                return;
            url = cfg.paths[moduleName] || moduleName;

            let len = url.length;
            if (url.lastIndexOf('js') !== (len - 2)) {
                if (cfg.paths[moduleName])
                    return console.error('module %s address %s is invalid', moduleName, url);
                else
                    return console.error('module %s is not exist', moduleName);
            }
            let head = document.getElementsByTagName('head')[0];

            let node = document.createElement('script');
            node.type = 'text/javascript';
            node.charset = 'utf-8';
            node.async = true;

            node.setAttribute('c-module', moduleName);
            node.addEventListener('load', this._onScriptLoad.bind(this), false);
            node.addEventListener('error', this._onScriptError.bind(this), false);
            node.src = url;
            this.loadSequence[moduleName] = true;
            head.appendChild(node);
        },
        _onScriptLoad(e) {
            if (e.type === 'load' || (readyRegExp.test((e.currentTarget || e.srcElement).readyState))) {
                let data = this._getScriptDate(e);
                this._completeLoad(data.id);
            }
        },
        _onScriptError(e) {
            let script = e.currentTarget;
            let module = script.getAttribute('c-module');
            let url = script.getAttribute('src');
            console.error('download module %s failed , address %s is not exist', module, url)
        },
        _completeLoad(moduleName) {
            let target = this.defined.shift();
            if (target[0] === null) {
                target[0] = moduleName;
            }
            this.module[moduleName] = new module(target[1], target[2]);
            this._callFinishedModule();
        },
        _callFinishedModule() {
            let loop = false;
            eachProp(this.module, function (obj) {
                if (!obj.ready) {
                    if (this.checkDependency(obj.dependency)) {
                        let dep = this.getDependency(obj.dependency);
                        obj.func = obj.callback.apply(obj.callback, dep);
                        obj.ready = true;
                        loop = true;
                    }
                }
            }.bind(this));
            if (loop) {
                this._callFinishedModule();
            } else {
                this._callFinishedRequire();
            }
        },
        _callFinishedRequire() {
            let len = this.requireSequence.length;
            if (this.requireSequence) {
                for (let i = len - 1; i >= 0;) {
                    let t = this.requireSequence[i];
                    if (this.checkDependency(t[0])) {
                        let c = this.requireSequence.pop();
                        let dep = this.getDependency(c[0]);
                        c[1].apply(c[1], dep);
                    }
                    i--;
                }
            }
        },
        _getScriptDate(e) {
            let node = e.currentTarget || e.srcElement;

            node.removeEventListener('load', this._onScriptLoad, false);
            node.removeEventListener('error', this._onScriptError, false);

            return {
                node: node,
                id: node && node.getAttribute('c-module')
            };
        }
    };

    colossus.require = require = function (dependencies, callback) {
        if (!callback) {
            callback = dependencies;
            dependencies = null;
        }

        if (!dependencies) {
            callback();
        } else {
            if (req.checkDependency(dependencies)) {
                let dep = req.getDependency(dependencies);
                callback.apply(callback, dep);
            } else {
                if (dependencies instanceof Array) {
                    req.requireSequence.push([dependencies, callback]);
                    dependencies.forEach(function (t) {
                        req.load(t)
                    })
                } else {
                    console.error('require depend error %s', dependencies)
                }
            }
        }
    };

    colossus.define = define = function (name, dependencies, callback) {
        if (typeof name !== 'string') {
            callback = dependencies;
            dependencies = name;
            name = null;
        }

        if (!colossus.tool.isArray(dependencies)) {
            callback = dependencies;
            dependencies = null;
        }
        if (dependencies) {
            dependencies.forEach(function (t) {
                req.load(t);
            })
        }

        req.defined.push([name, dependencies, callback])
    };

    colossus.init = function (dependencies, callback) {
        console.trace('start to init');
        return require(dependencies, callback);
    };

    /**
     * 启动
     */
    if (isBrowser) {
        let script = document.getElementsByTagName('script');
        script = Array.apply(null, script);
        script.reverse();
        script.some(function (t) {
            dataMain = t.getAttribute('c-main');
            if (dataMain) {
                let mainScript = document.createElement('script');
                mainScript.src = dataMain;
                head.appendChild(mainScript);
                return true;
            }
        })
    }

    window.colossus = colossus;
})();
