var Bridge, ExposedApi, ReadyCue, Server, exposed_sockets, fs, jot,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __hasProp = {}.hasOwnProperty,
  __slice = [].slice;

fs = require('fs');

jot = require('json-over-tcp');

Bridge = require('./bridge');

ExposedApi = require('./exposed-api');

ReadyCue = require('./ready-cue');

exposed_sockets = [];

Server = (function(_super) {
  __extends(Server, _super);

  Server.prototype.jotServer = null;

  Server.prototype.onConnectFns = null;

  Server.prototype.configPath = null;

  Server.prototype.name = null;

  Server.prototype.options = null;

  Server.prototype.exposed = null;

  Server.prototype.session = null;

  function Server() {
    this.onConnect = __bind(this.onConnect, this);
    this.start = __bind(this.start, this);
    this.onConnectFns = [];
    this.exposed = {};
    this.session = {};
    this.options = {};
  }

  Server.prototype.expose = ExposedApi.prototype.expose;

  Server.prototype.exposeHash = ExposedApi.prototype.exposeHash;

  Server.prototype.setConfig = Bridge.prototype.setConfig;

  Server.prototype.setOptions = Bridge.prototype.setOptions;

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
        var bridge;
        bridge = new Bridge;
        bridge.setConfig(name, options);
        bridge.expose(_this.exposed);
        bridge.session = _this.session;
        bridge.socket = socket;
        bridge.revealExposed();
        exposed_sockets.push(socket);
        socket.on('data', function(data) {
          var fn, _i, _len, _ref1;
          if (data.api) {
            bridge.attachRemote(data);
            _ref1 = _this.onConnectFns;
            for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
              fn = _ref1[_i];
              fn(bridge.wrapCallback(function() {}));
            }
            return socket.write({
              ack: 1
            });
          } else if (data.req) {
            return bridge.request(data.req);
          } else {
            return bridge.response(data != null ? data.res : void 0);
          }
        });
        socket.on('error', function(err) {});
        return socket.on('close', function() {
          console.log('[CLOSE]');
          return bridge.connectionLost('client');
        });
      };
    })(this));
    this.jotServer.on('error', (function(_this) {
      return function(err) {
        if (err.code === 'EADDRINUSE') {
          return fs.unlink(_this.socketFile, function(unlink_err) {
            if (unlink_err) {
              console.error(unlink_err.stack);
              console.error(err.stack);
              process.exit(1);
            }
            return _this.jotServer.listen(_this.socketFile);
          });
        } else {
          throw err;
        }
      };
    })(this));
    return this.jotServer.listen(this.socketFile);
  };

  Server.prototype.onConnect = function(fn) {
    this.onConnectFns.push(fn);
  };

  return Server;

})(ReadyCue);

module.exports = Server;

(function() {
  var cleaned_up, config_path, event, fd, file, fn, home, name, opts, socket_file, type, _fn, _fn1, _i, _j, _len, _len1, _ref, _ref1;
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
    fd = {};
    _ref = ['err', 'out'];
    _fn = function(type) {
      return process['std' + type].write = function(d) {
        var exposed_socket, inf, _j, _len1;
        if (exposed_sockets.length) {
          (inf = {})[type] = d;
          for (_j = 0, _len1 = exposed_sockets.length; _j < _len1; _j++) {
            exposed_socket = exposed_sockets[_j];
            try {
              exposed_socket.write({
                std: inf
              });
            } catch (_error) {}
          }
        }
        try {
          if (fd[type] == null) {
            fd[type] = fs.openSync(file + type, 'a');
          }
        } catch (_error) {}
        try {
          return fs.writeSync(fd[type], d);
        } catch (_error) {
          fd[type] = fs.openSync(file + type, 'a');
          try {
            return fs.writeSync(fd[type], d);
          } catch (_error) {}
        }
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
          var args, exit_code, _k, _len2, _ref2;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          if (!(cleaned_up && socket_file)) {
            try {
              fs.unlink(socket_file);
              _ref2 = ['err', 'out'];
              for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
                type = _ref2[_k];
                if (!fd[type]) {
                  continue;
                }
                fs.closeSync(fd[type]);
                delete fd[type];
              }
              cleaned_up = true;
            } catch (_error) {}
          }
          if (event === 'uncaughtException') {
            console.error('[PROCESS EVENT] uncaughtException\n' + args[0].stack);
          } else {
            console.log.apply(console, ['[PROCESS EVENT]', event].concat(__slice.call(args)));
          }
          if (event !== 'exit') {
            exit_code = event === 'uncaughtException' ? 1 : 0;
            return process.exit(exit_code);
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
