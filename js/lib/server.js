var Bridge, Server, fs, jot,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __slice = [].slice;

fs = require('fs');

jot = require('json-over-tcp');

Bridge = require('./bridge');

Server = (function(_super) {
  __extends(Server, _super);

  function Server() {
    this.start = __bind(this.start, this);
    return Server.__super__.constructor.apply(this, arguments);
  }

  Server.prototype.jotServer = null;

  Server.prototype.start = function(name, options, cb) {
    var _ref;
    if (typeof options !== 'object') {
      _ref = [options, {}], cb = _ref[0], options = _ref[1];
    }
    this.setConfig(name, options);
    this.jotServer = jot.createServer(this.socketFile);
    this.jotServer.on('listening', (function(_this) {
      return function() {
        console.log('server listening on:', _this.socketFile);
        return _this.readyFlush(cb);
      };
    })(this));
    this.jotServer.on('connection', (function(_this) {
      return function(socket) {
        _this.socket = socket;
        _this.revealExposed();
        return socket.on('data', function(data) {
          if (data.api) {
            _this.attachRemote(data);
            return socket.write({
              ack: 1
            });
          } else if (data.req) {
            return _this.request(data.req);
          } else {
            return _this.response(data != null ? data.res : void 0);
          }
        });
      };
    })(this));
    return this.jotServer.listen(this.socketFile);
  };

  return Server;

})(Bridge);

module.exports = Server;

(function() {
  var cleaned_up, config_path, event, file, fn, home, name, opts, socket_file, std_streams, type, _fn, _fn1, _i, _j, _len, _len1, _ref, _ref1;
  fn = process.mainModule.filename;
  if (fn.indexOf('node_modules/daemonize2/lib/wrapper.js') === fn.length - 38) {
    name = process.title;
    home = process.env.HOME;
    if (process.platform === 'win32') {
      home = process.env.USERPROFILE;
    }
    if (!(name && home)) {
      throw new Error('APID can not find environment values for home|name: ' + home + '|' + name);
    }
    config_path = home + '/.config/' + name;
    require('mkdirp').sync(config_path);
    file = config_path + '/apid-' + process.getuid() + '.';
    opts = {
      encoding: 'utf8',
      flags: 'a'
    };
    std_streams = {};
    _ref = ['err', 'out'];
    _fn = function(type) {
      return process['std' + type].write = function(d) {
        if (!std_streams[type]) {
          std_streams[type] = fs.createWriteStream(file + type, opts);
          std_streams[type].once('close', function() {
            return std_streams[type] = null;
          });
          std_streams[type].once('error', function() {
            return std_streams[type] = null;
          });
        }
        return std_streams[type].write(d);
      };
    };
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      type = _ref[_i];
      _fn(type);
    }
    cleaned_up = false;
    socket_file = config_path + '/apid-' + process.getuid() + '.socket';
    _ref1 = ['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGBREAK', 'exit', 'uncaughtException'];
    _fn1 = function(event) {
      return process.on(event, (function(_this) {
        return function() {
          var args;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          console.log.apply(console, ['Event:', event].concat(__slice.call(args)));
          if (!(cleaned_up && socket_file)) {
            console.log('unlinking', socket_file);
            try {
              fs.unlink(socket_file);
              cleaned_up = true;
            } catch (_error) {}
          }
          if (event !== 'exit') {
            return process.exit(0);
          }
        };
      })(this));
    };
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      event = _ref1[_j];
      _fn1(event);
    }
  }
})();
