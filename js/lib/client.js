var Bridge, Client, arg, daemon_std, fs, jot, _i, _len, _ref,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

fs = require('fs');

jot = require('json-over-tcp');

Bridge = require('./bridge');

daemon_std = {};

_ref = process.argv.slice(2);
for (_i = 0, _len = _ref.length; _i < _len; _i++) {
  arg = _ref[_i];
  if (arg === '--daemon-stderr') {
    daemon_std.err = true;
  }
  if (arg === '--daemon-stdout') {
    daemon_std.out = true;
  }
}

Client = (function(_super) {
  __extends(Client, _super);

  Client.prototype.requirePath = null;

  function Client(name) {
    this.connect = __bind(this.connect, this);
    Client.__super__.constructor.apply(this, arguments);
    this.setConfig(name);
  }

  Client.prototype.connect = function(require_path, options, cb) {
    var mkdirp, _ref1;
    this.requirePath = require.resolve(require_path);
    if (typeof options !== 'object') {
      _ref1 = [options, {}], cb = _ref1[0], options = _ref1[1];
    }
    this.setOptions(options);
    mkdirp = require('mkdirp');
    return mkdirp(this.configPath, (function(_this) {
      return function(err) {
        var buffer, buffer_count, connect, daemon, last_reconnect, listener_added, setup, timeout;
        if (err) {
          return cb(err);
        }
        setup = {
          cwd: options.cwd || process.cwd(),
          main: _this.requirePath,
          name: _this.name,
          pidfile: _this.pidFile,
          silent: true
        };
        if (options.coffeePath) {
          setup.coffeePath = options.coffeePath;
        }
        timeout = options.timeout || 5;
        if (!(timeout > 0)) {
          timeout = 5;
        } else if (timeout > 30) {
          timeout = 30;
        }
        daemon = require('daemonize2').setup(setup);
        if (require('./daemon-control')(daemon, _this.name)) {
          return;
        }
        listener_added = false;
        last_reconnect = null;
        connect = function() {
          var handshake;
          handshake = 0;
          _this.socket = jot.connect(_this.socketFile, function() {
            _this.revealExposed();
            if (listener_added) {
              return;
            }
            listener_added = true;
            return _this.socket.on('data', function(data) {
              var str;
              if (data.std) {
                if ((str = data.std.out) && (daemon_std.out || options.stdout)) {
                  process.stdout.write('[APID STDOUT] ' + str);
                }
                if ((str = data.std.err) && (daemon_std.err || options.stderr)) {
                  return process.stderr.write('[APID STDERR] ' + str);
                }
              } else if (data.api) {
                _this.attachRemote(data);
                handshake += 1;
                if (handshake === 2) {
                  return _this.readyFlush(cb);
                }
              } else if (data.ack) {
                handshake += 1;
                if (handshake === 2) {
                  return _this.readyFlush(cb);
                }
              } else if (data.req) {
                return _this.request(data.req);
              } else {
                return _this.response(data != null ? data.res : void 0);
              }
            });
          });
          return _this.socket.on('error', function(err) {
            if (!(last_reconnect > (new Date).getTime() - 1000)) {
              console.error('JOT socket error:', err);
              console.log('Attempting to reconnect in .1s');
              return setTimeout((function() {
                last_reconnect = (new Date).getTime();
                return connect();
              }), 100);
            }
          });
        };
        buffer_count = 0;
        buffer = function() {
          return fs.exists(_this.socketFile, function(exists) {
            if (timeout * 1000 < buffer_count * (buffer_count / 2) * 10) {
              throw new Error('Socket wait exceeded timeout of ~' + timeout + 's');
            } else if (exists) {
              return setTimeout(connect, 1);
            } else {
              buffer_count += 1;
              return setTimeout(buffer, buffer_count * 10);
            }
          });
        };
        daemon.on('started', buffer).on('running', connect).on('error', function(err) {
          throw err;
        });
        return daemon.start();
      };
    })(this));
  };

  return Client;

})(Bridge);

module.exports = Client;
