// Generated by CoffeeScript 1.7.1
var api, callback_id, callbacks, callbax,
  __slice = [].slice;

callbax = null;

callback_id = 0;

callbacks = {};

module.exports.api = api = {};

module.exports.attach = function(map, socket, target) {
  var copy_to_api, functionize, key;
  if (target == null) {
    target = api;
  }
  if (callbax == null) {
    callbax = require('callbax');
  }
  functionize = function(keys) {
    return callbax(function() {
      var args, cb, err, msg, _i;
      args = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), cb = arguments[_i++];
      if (typeof cb !== 'function') {
        throw new Error('Callback function is required as last argument');
      }
      callback_id += 1;
      callbacks[callback_id] = cb;
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
        return socket.write(msg);
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
  for (key in api) {
    delete api[key];
  }
  copy_to_api(map, target);
};

module.exports.response = function(res) {
  var cb, _ref;
  if (!((res != null ? res.id : void 0) >= 1 && (cb = callbacks[res.id]))) {
    console.error('dropping unparsible response:', res);
  }
  delete callbacks[res.id];
  if ((_ref = res.args) != null ? _ref.length : void 0) {
    return cb.apply(null, JSON.parse(res.args));
  } else {
    return cb();
  }
};
