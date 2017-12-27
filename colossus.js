'use strict';

window.colossus = {};
let require, define;
(function () {

    /**
     * DOM ready方法
     * @param callback
     * @return {boolean}
     */
    function documentReady(callback) {
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
    }

    function hasProp(obj, prop) {
        return Object.prototype.hasOwnProperty.call(obj, prop);
    }

    /**
     * 对象key遍历方法
     * @param obj
     * @param func
     */
    function eachProp(obj, func) {
        let prop;
        for (prop in obj) {
            if (hasProp(obj, prop)) {
                if (func(obj[prop], prop)) {
                    break;
                }
            }
        }
    }

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
        router = {},
        map = {},
        plus = {};

    /**
     * 合并默认配置
     * @param obj
     */
    colossus.config = function (obj) {
        let allow = {
            paths: true
        };

        eachProp(obj, function (value, prop) {
            if (allow[prop]) {
                if (!cfg[prop]) {
                    cfg[prop] = {};
                }
                colossus.tool.extend(cfg[prop], value, true);
            }
        });
    };

    let delegate = function () {
        /**
         * @desc 监听器存取对象
         * @type {object}
         * @private
         */
        this._listeners = {};
    };

    delegate.prototype.add = function (type, listener, target) {
        if (this._listeners === undefined)
            this._listeners = {};

        let listeners = this._listeners;
        if (listeners[type] === undefined)
            listeners[type] = [];

        if (!this._hasDelegate(type, listener, target))
            listeners[type].push({callback: listener, eventTarget: target});
    };

    /**
     * @description dispatch specific event with data @eventData
     * 通过指定的event字符串来唤醒注册的代理事件
     * @param {string} event
     * @param [eventData] {*}
     * @param [clearAfterDispatch] {boolean}
     */
    delegate.prototype.dispatch = function (event, eventData, clearAfterDispatch) {
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

            for (i = 0; i < length; i++) {
                array[i].callback.call(array[i].eventTarget, eventData);
            }

            if (!!clearAfterDispatch)
                listenerArray.length = 0;
        }
    };

    delegate.prototype._hasDelegate = function (type, listener, target) {
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
    };

    /**
     * @description remove all delegate event on specific instance
     * 移除指定实例上的所有代理事件
     * @param target
     */
    delegate.prototype.cleanDelegate = function (target) {
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
    };

    /**
     * @description remove specific type of delegate on specific target instance
     * 从指定实例上移除指定的事件代理
     * @param type
     * @param target
     */
    delegate.prototype.removeDelegate = function (type, target) {
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
    };

    colossus.delegate = new delegate();

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
        } else {
            return console.error('请求参数 data %s 格式不合法', data);
        }

        let dataType = options.dataType || 'text';
        let xhr = new XMLHttpRequest();
        xhr.open(type, url, true);
        if (type === "POST" || type === "post") {
            xhr.setRequestHeader("content-type", "application/x-www-form-urlencoded");
        }
        xhr.send(data);

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

    colossus.tool = {
        extend: function (target, source, deep) {
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
        isArray: function (it) {
            return Object.prototype.toString.call(it) === '[object Array]';
        },
        isFunction: function (it) {
            return Object.prototype.toString.call(it) === '[object Function]';
        }
    };

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

    let Req = function () {
        this.module = {};
        this.requireSequence = [];
        this.defined = [];
        this.loadSequence = {};
    };

    Req.prototype.checkDependency = function (dependencies) {
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
    };

    Req.prototype.getDependency = function (dependencies) {
        return dependencies.map(function (t) {
            return this.module[t].func;
        }.bind(this))
    };

    Req.prototype.load = function (moduleName, url) {
        if (this.loadSequence[moduleName])
            return;
        url = cfg.paths[moduleName] || moduleName;

        if (url.indexOf('js') === -1) {
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
    };

    Req.prototype._onScriptLoad = function (e) {
        if (e.type === 'load' || (readyRegExp.test((e.currentTarget || e.srcElement).readyState))) {
            let data = this._getScriptDate(e);
            this._completeLoad(data.id);
        }
    };

    Req.prototype._onScriptError = function (e) {
        let script = e.currentTarget;
        let module = script.getAttribute('c-module');
        let url = script.getAttribute('src');
        console.error('download module %s failed , address %s is not exist', module, url)
    };

    Req.prototype._completeLoad = function (moduleName) {
        let target = this.defined.shift();
        if (target[0] === null) {
            target[0] = moduleName;
        }
        this.module[moduleName] = new module(target[1], target[2]);
        this._callFinishedModule();
    };

    Req.prototype._callFinishedModule = function () {
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
    };

    Req.prototype._callFinishedRequire = function () {
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
    };

    Req.prototype._getScriptDate = function (e) {
        let node = e.currentTarget || e.srcElement;

        node.removeEventListener('load', this._onScriptLoad, false);
        node.removeEventListener('error', this._onScriptError, false);

        return {
            node: node,
            id: node && node.getAttribute('c-module')
        };
    };

    let req = new Req();

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
        console.info('start to init');
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
