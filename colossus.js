'use strict';

window.colossus = {};
var require, define;
(function () {
    var colossus = {};
    var commentRegExp = /\/\*[\s\S]*?\*\/|([^:"'=]|^)\/\/.*$/mg,
        cjsRequireRegExp = /[^.]\s*require\s*\(\s*["']([^'"\s]+)["']\s*\)/g,
        isBrowser = !!(typeof window !== 'undefined' && typeof navigator !== 'undefined' && window.document),
        isWebWorker = !isBrowser && typeof importScripts !== 'undefined',
        readyRegExp = isBrowser && navigator.platform === 'PLAYSTATION 3' ? /^complete$/ : /^(complete|loaded)$/,
        dataMain;

    var delegate = function () {
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

        var listeners = this._listeners;
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

        var listeners = this._listeners;
        var listenerArray = listeners[event];

        if (listenerArray !== undefined) {

            if(!eventData)
                eventData = null;

            var array = [];
            var length = listenerArray.length;

            for (var i = 0; i < length; i++) {
                array[i] = listenerArray[i];
            }

            for (i = 0; i < length; i++) {
                array[i].callback.call(array[i].eventTarget, eventData, this);
            }

            if (!!clearAfterDispatch)
                listenerArray.length = 0;
        }
    };

    delegate.prototype._hasDelegate = function (type, listener, target) {
        if (this._listeners === undefined)
            return false;

        var listeners = this._listeners;
        if (listeners[type] !== undefined) {
            for (var i = 0, len = listeners[type].length; i < len; i++) {
                var selListener = listeners[type][i];
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

        var listeners = this._listeners;
        for (var key in listeners) {
            var listenerArray = listeners[key];

            if (listenerArray !== undefined) {
                for (var i = 0; i < listenerArray.length;) {
                    var selListener = listenerArray[i];
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

        var listeners = this._listeners;
        var listenerArray = listeners[type];

        if (listenerArray !== undefined) {
            for (var i = 0; i < listenerArray.length;) {
                var selListener = listenerArray[i];
                if (selListener.eventTarget === target)
                    listenerArray.splice(i, 1);
                else
                    i++
            }
        }
    };

    colossus.delegate = new delegate();

    colossus.tool = {
        isArray: function (it) {
            return Object.prototype.toString.call(it) === '[object Array]';
        },
        isFunction: function (it) {
            return Object.prototype.toString.call(it) === '[object Function]';
        }
    };

    var test = function (e) {
        debugger;
    };


    require = function (dependencies,callback) {
        var head = document.getElementsByTagName('head')[0];
        var script;
        dependencies.forEach(function (t) {
            script = document.createElement('script');
            script.src = t;
            script.addEventListener('load', test, false);
            script.addEventListener('error', test, false);
            head.appendChild(script);
        })
    };



    define = function (name, dependencies, callback) {
        var node, context;

        if (typeof name !== 'string') {
            callback = dependencies;
            dependencies = name;
            name = null;
        }

        if (!colossus.tool.isArray(dependencies)) {
            callback = dependencies;
            dependencies = null;
        }

    };



    /**
     * 启动
     */
    if (isBrowser) {
        var head = document.getElementsByTagName('head')[0];
        var script = document.getElementsByTagName('script');
        script = Array.apply(null, script);
        script.reverse();
        script.some(function (t) {
            if (!head) {
                head = t.parentNode;
            }
            dataMain = t.getAttribute('c-main');
            if (dataMain) {
                var mainScript = document.createElement('script');
                mainScript.src = dataMain;
                head.appendChild(mainScript);
                return true;
            }
        })
    }

    window.colossus = colossus;
})();
