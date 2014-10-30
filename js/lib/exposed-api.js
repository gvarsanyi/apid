// Generated by CoffeeScript 1.7.1
var api,
  __slice = [].slice;

module.exports.api = api = {};

api.ping = function(cb) {
  return cb(null, 'pong');
};

module.exports.expose = function(key, fn) {
  var _ref;
  if (typeof fn !== 'function') {
    throw new Error('Attached API interfaces must be functions (' + key + ')');
  }
  if ((_ref = typeof key) !== 'string' && _ref !== 'number') {
    throw new Error('Invalid API name: ' + key);
  }
  return api[key] = fn;
};

module.exports.reveal = function(socket) {
  var key, list;
  list = [];
  for (key in api) {
    if (typeof api[key] !== 'function') {
      throw new Error('Attached API interfaces must be functions (' + key + ')');
    }
    list.push(key);
  }
  return socket.write({
    api: list
  });
};

module.exports.request = function(req, socket, target) {
  var args, cb, err;
  cb = function() {
    var args, msg;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    msg = {
      res: {
        id: req.id
      }
    };
    if (args.length) {
      msg.res.args = JSON.stringify(args);
    }
    return socket.write(msg);
  };
  if (target) {
    cb.remote = target;
  }
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
    if (typeof api[req.fn] !== 'function') {
      throw new Error('No such exposed method: ' + req.fn);
    }
    if (args) {
      return api[req.fn].apply(api, __slice.call(args).concat([cb]));
    } else {
      return api[req.fn](cb);
    }
  } catch (_error) {
    err = _error;
    console.error('failed request', req, err);
    return cb(err);
  }
};
