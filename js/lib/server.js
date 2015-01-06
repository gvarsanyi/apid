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

  Server.prototype.jotServer = null;

  function Server() {
    this.start = __bind(this.start, this);
    this.divertStdOutput = __bind(this.divertStdOutput, this);
    this.divertExit = __bind(this.divertExit, this);
    Server.__super__.constructor.apply(this, arguments);
  }

  Server.prototype.divertExit = function() {
    var cleaned_up, event, _fn, _i, _len, _ref;
    cleaned_up = false;
    _ref = ['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGBREAK', 'exit', 'uncaughtException'];
    _fn = (function(_this) {
      return function(event) {
        return process.on(event, function() {
          var args;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          console.log.apply(console, ['Event:', event].concat(__slice.call(args)));
          if (!(cleaned_up && _this.socketFile)) {
            console.log('unlinking', _this.socketFile);
            try {
              fs.unlink(_this.socketFile);
              cleaned_up = true;
            } catch (_error) {}
          }
          if (event !== 'exit') {
            return process.exit(0);
          }
        });
      };
    })(this);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      event = _ref[_i];
      _fn(event);
    }
  };

  Server.prototype.divertStdOutput = function(cb) {
    var mkdirp;
    mkdirp = require('mkdirp');
    return mkdirp(this.configPath, (function(_this) {
      return function(err) {
        var file, opts, std_streams, type, _fn, _i, _len, _ref;
        if (err) {
          return cb(err);
        }
        file = _this.configPath + '/apid-' + process.getuid() + '.';
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
        return cb();
      };
    })(this));
  };

  Server.prototype.start = function(name, options, cb) {
    var _ref;
    if (typeof options !== 'object') {
      _ref = [options, {}], cb = _ref[0], options = _ref[1];
    }
    this.setConfig(name, options);
    this.divertExit();
    return this.divertStdOutput((function(_this) {
      return function() {
        _this.jotServer = jot.createServer(_this.socketFile);
        _this.jotServer.on('listening', function() {
          console.log('server listening on:', _this.socketFile);
          return _this.readyFlush(cb);
        });
        _this.jotServer.on('connection', function(socket) {
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
        });
        return _this.jotServer.listen(_this.socketFile);
      };
    })(this));
  };

  return Server;

})(Bridge);

module.exports = Server;
