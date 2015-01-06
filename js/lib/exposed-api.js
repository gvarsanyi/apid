var ExposedApi, RemoteApi, callbax,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __slice = [].slice;

callbax = require('callbax');

RemoteApi = require('./remote-api');

ExposedApi = (function(_super) {
  __extends(ExposedApi, _super);

  ExposedApi.prototype.exposed = null;

  ExposedApi.prototype.session = null;

  function ExposedApi() {
    this.request = __bind(this.request, this);
    this.revealExposed = __bind(this.revealExposed, this);
    this.exposeHash = __bind(this.exposeHash, this);
    this.expose = __bind(this.expose, this);
    ExposedApi.__super__.constructor.apply(this, arguments);
    this.exposed = {
      console: {
        log: function() {
          var args, cb, _i;
          args = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), cb = arguments[_i++];
          console.log.apply(console, args);
          return cb();
        },
        error: function() {
          var args, cb, _i;
          args = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), cb = arguments[_i++];
          console.error.apply(console, args);
          return cb();
        }
      },
      ping: function(cb) {
        return cb(null, 'pong');
      }
    };
    this.session = {};
  }

  ExposedApi.prototype.expose = function() {
    var fn, key, key_check, keys, last_key, target, _i, _j, _len, _ref;
    keys = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), fn = arguments[_i++];
    if (fn && typeof fn === 'object') {
      return this.exposeHash(fn, keys);
    }
    if (typeof fn !== 'function') {
      throw new Error('Attached API interfaces must be functions (' + key + ')');
    }
    key_check = function(key) {
      var _ref;
      if (!((key || key === 0) && ((_ref = typeof key) === 'string' || _ref === 'number'))) {
        throw new Error('Invalid API name: ' + keys.join('.'));
      }
    };
    target = this.exposed;
    key_check(last_key = keys[keys.length - 1]);
    if (keys.length > 1) {
      _ref = keys.slice(0, keys.length - 1);
      for (_j = 0, _len = _ref.length; _j < _len; _j++) {
        key = _ref[_j];
        key_check(key);
        target = (target[key] != null ? target[key] : target[key] = {});
      }
    }
    target[last_key] = fn;
  };

  ExposedApi.prototype.exposeHash = function(src, keys) {
    var item, key, new_keys, ref;
    for (key in src) {
      ref = src[key];
      new_keys = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = keys.length; _i < _len; _i++) {
          item = keys[_i];
          _results.push(item);
        }
        return _results;
      })();
      new_keys.push(key);
      this.expose.apply(this, __slice.call(new_keys).concat([ref]));
    }
  };

  ExposedApi.prototype.revealExposed = function() {
    var copy_to_map, map;
    copy_to_map = function(src, target) {
      var key, node;
      for (key in src) {
        node = src[key];
        if (node && typeof node === 'object') {
          copy_to_map(node, (target[key] = {}));
        } else {
          target[key] = 1;
        }
      }
    };
    copy_to_map(this.exposed, (map = {}));
    return this.socket.write({
      api: map,
      session: this.session
    });
  };

  ExposedApi.prototype.request = function(req) {
    var args, cb, check_log, err, functions, item, target, target_fn, target_session;
    target = this.remote;
    target_session = this.remoteSession;
    cb = callbax((function(_this) {
      return function() {
        var arg, args, i, msg, _base, _i, _len;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        msg = {
          res: {
            id: req.id
          }
        };
        if (args.length) {
          for (i = _i = 0, _len = args.length; _i < _len; i = ++_i) {
            arg = args[i];
            if (!(arg instanceof Error)) {
              continue;
            }
            ((_base = msg.res).errType != null ? _base.errType : _base.errType = []).push(i);
            args[i] = arg.message;
          }
          msg.res.args = JSON.stringify(args);
        }
        return _this.socket.write(msg);
      };
    })(this));
    cb.remote = target;
    cb.session = target_session;
    check_log = function(args, callback) {
      if (typeof callback !== 'function' && (callback != null)) {
        args.push(callback);
        callback = function() {};
      }
      if (args.length) {
        return callback;
      } else {
        return null;
      }
    };
    cb.log = function() {
      var args, callback, _i, _ref;
      args = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), callback = arguments[_i++];
      if (callback = check_log(args, callback)) {
        return (_ref = cb.remote.console).log.apply(_ref, __slice.call(args).concat([callback]));
      }
    };
    cb.errorLog = function() {
      var args, callback, _i, _ref;
      args = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), callback = arguments[_i++];
      if (callback = check_log(args, callback)) {
        return (_ref = cb.remote.console).error.apply(_ref, __slice.call(args).concat([callback]));
      }
    };
    try {
      if (!((req != null ? req.id : void 0) >= 1)) {
        throw new Error('dropping request with invalid req id:' + req.id);
      }
      if ((args = req.args) != null) {
        args = JSON.parse(args);
        if (!(Array.isArray(args) && args.length)) {
          throw new Error('Invalid arguments: ' + req.args);
        }
      }
      functions = (function() {
        var _i, _len, _ref, _results;
        _ref = req.fn;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          item = _ref[_i];
          _results.push(item);
        }
        return _results;
      })();
      target_fn = this.exposed;
      while (functions.length) {
        if (!(target_fn = target_fn[functions.shift()])) {
          throw new Error('No such exposed method: ' + req.fn);
        }
      }
      if (typeof target_fn !== 'function') {
        throw new Error('No such exposed method: ' + req.fn);
      }
      if (args) {
        return target_fn.apply(null, __slice.call(args).concat([cb]));
      } else {
        return target_fn(cb);
      }
    } catch (_error) {
      err = _error;
      console.error('failed request', req, err);
      return cb(err);
    }
  };

  return ExposedApi;

})(RemoteApi);

module.exports = ExposedApi;
