var Bridge, Client, arg, daemon_std, jot, _i, _len, _ref,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

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
        var connect, daemon, setup;
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
        daemon = require('daemonize2').setup(setup);
        if (require('./daemon-control')(daemon, _this.name)) {
          return;
        }
        connect = function() {
          var handshake;
          handshake = 0;
          return _this.socket = jot.connect(_this.socketFile, function() {
            _this.revealExposed();
            return _this.socket.on('data', function(data) {
              var d, type, _ref2, _results;
              if (data.std) {
                _ref2 = data.std;
                _results = [];
                for (type in _ref2) {
                  d = _ref2[type];
                  if (daemon_std[type] && (data.std[type] != null)) {
                    _results.push(process.stderr.write('[APID STD' + type.toUpperCase() + '] ' + d));
                  }
                }
                return _results;
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
        };
        daemon.on('started', connect).on('running', connect).on('error', function(err) {
          throw err;
        });
        return daemon.start();
      };
    })(this));
  };

  return Client;

})(Bridge);

module.exports = Client;
