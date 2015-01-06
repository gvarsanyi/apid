var ReadyCue, RemoteApi, callbax,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __slice = [].slice;

callbax = require('callbax');

ReadyCue = require('./ready-cue');

RemoteApi = (function(_super) {
  __extends(RemoteApi, _super);

  RemoteApi.prototype.remote = null;

  RemoteApi.prototype.remoteCallId = 0;

  RemoteApi.prototype.remoteCalls = null;

  RemoteApi.prototype.remoteSession = null;

  function RemoteApi() {
    this.response = __bind(this.response, this);
    this.attachRemote = __bind(this.attachRemote, this);
    RemoteApi.__super__.constructor.apply(this, arguments);
    this.remote = {};
    this.remoteCalls = {};
    this.remoteSession = {};
  }

  RemoteApi.prototype.attachRemote = function(data) {
    var copy_to_api, functionize, key, target, target_session, value, _ref;
    target = this.remote;
    target_session = this.remoteSession;
    functionize = (function(_this) {
      return function(keys) {
        return callbax(function() {
          var args, callback_id, callbacks, cb, err, msg, _i;
          args = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), cb = arguments[_i++];
          if (typeof cb !== 'function') {
            throw new Error('Callback function is required as last argument');
          }
          callback_id = (_this.remoteCallId += 1);
          (callbacks = _this.remoteCalls)[callback_id] = cb;
          try {
            msg = {
              req: {
                id: callback_id,
                fn: keys
              }
            };
            if (args.length) {
              msg.req.args = JSON.stringify(args);
            }
            return _this.socket.write(msg);
          } catch (_error) {
            err = _error;
            console.error('error requesting:', err);
            if (cb = callbacks[callback_id]) {
              delete callbacks[callback_id];
              return cb(err);
            }
          }
        });
      };
    })(this);
    copy_to_api = function(src, target, keys) {
      var item, key, new_keys, node;
      if (keys == null) {
        keys = [];
      }
      for (key in src) {
        node = src[key];
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
        if (node && typeof node === 'object') {
          copy_to_api(node, (target[key] = {}), new_keys);
        } else {
          target[key] = functionize(new_keys);
        }
      }
    };
    for (key in target) {
      delete target[key];
    }
    copy_to_api(data.api, target);
    for (key in target_session) {
      delete target_session[key];
    }
    _ref = data.session || {};
    for (key in _ref) {
      value = _ref[key];
      target_session[key] = value;
    }
  };

  RemoteApi.prototype.response = function(res) {
    var args, callbacks, cb, i, _i, _len, _ref, _ref1;
    callbacks = this.remoteCalls;
    if (!((res != null ? res.id : void 0) >= 1 && (cb = callbacks[res.id]))) {
      console.error('dropping unparsible response:', res);
    }
    delete callbacks[res.id];
    if ((_ref = res.args) != null ? _ref.length : void 0) {
      args = JSON.parse(res.args);
      _ref1 = res.errType || [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        i = _ref1[_i];
        args[i] = new Error(args[i]);
      }
      return cb.apply(null, args);
    } else {
      return cb();
    }
  };

  return RemoteApi;

})(ReadyCue);

module.exports = RemoteApi;
