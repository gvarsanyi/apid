var Bridge, Server, exposed_socket, fs, jot,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __slice = [].slice;

fs = require('fs');

jot = require('json-over-tcp');

Bridge = require('./bridge');

exposed_socket = null;

Server = (function(_super) {
  __extends(Server, _super);

  Server.prototype.jotServer = null;

  Server.prototype.onConnectCue = null;

  function Server() {
    this.onConnect = __bind(this.onConnect, this);
    this.start = __bind(this.start, this);
    this.onConnectCue = [];
    Server.__super__.constructor.apply(this, arguments);
  }

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
        exposed_socket = socket;
        socket.on('data', function(data) {
          var fn;
          if (data.api) {
            _this.attachRemote(data);
            while (fn = _this.onConnectCue.shift()) {
              fn(_this.remote);
            }
            return socket.write({
              ack: 1
            });
          } else if (data.req) {
            return _this.request(data.req);
          } else {
            return _this.response(data != null ? data.res : void 0);
          }
        });
        return socket.on('close', function() {
          return _this.connectionLost('client');
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
    this.onConnectCue.push(fn);
  };

  return Server;

})(Bridge);

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
        var inf;
        if (exposed_socket) {
          (inf = {})[type] = d;
          try {
            exposed_socket.write({
              std: inf
            });
          } catch (_error) {}
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
