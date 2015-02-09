module.exports = function(daemon, name, cb) {
  var arg, cmd, ctrl, error, fn, found, notrunning, running, started, starting, stopped, stopping, suggest_to_continue, _i, _len, _ref;
  error = function(err) {
    return console.error(err);
  };
  notrunning = function() {
    var msg;
    console.log(msg = 'daemon is not running');
    if (cmd === 'status') {
      return cb();
    } else if (cmd === 'kill' || cmd === 'stop') {
      return cb(new Error(msg));
    }
  };
  running = function(pid) {
    var msg;
    console.log(msg = 'daemon is running: ' + name + ' (pid: ' + pid + ')');
    if (cmd === 'status') {
      return cb();
    } else if (cmd === 'start') {
      return cb(new Error(msg));
    }
  };
  starting = function() {
    return console.log('starting daemon...');
  };
  started = function(pid) {
    console.log('started daemon: ' + name + ' (pid: ' + pid + ')');
    return cb(null, suggest_to_continue);
  };
  stopping = function() {
    return console.log('stopping daemon...');
  };
  stopped = function(pid) {
    console.log('stopped daemon: ' + name + ' (pid: ' + pid + ')');
    if (cmd === 'kill' || cmd === 'stop') {
      return cb(null, suggest_to_continue);
    }
  };
  suggest_to_continue = false;
  ctrl = {
    kill: function() {
      return daemon.kill();
    },
    start: function() {
      return daemon.start();
    },
    stop: function() {
      return daemon.stop();
    },
    reload: function() {
      var pid;
      suggest_to_continue = true;
      if (pid = daemon.status()) {
        console.log('sending reload signal to daemon: ' + name + ' (pid: ' + pid + ')');
        return daemon.sendSignal('SIGUSR1');
      } else {
        return daemon.start();
      }
    },
    restart: function() {
      suggest_to_continue = true;
      return daemon.stop(function(err) {
        if (!err) {
          return daemon.start();
        }
      });
    },
    status: function() {
      var pid;
      if (pid = daemon.status()) {
        return console.log('daemon is running: ' + name + ' (pid: ' + pid + ')');
      } else {
        return console.log('daemon is not running');
      }
    }
  };
  found = false;
  cmd = null;
  _ref = process.argv.slice(2);
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    arg = _ref[_i];
    if (arg.substr(0, 9) === '--daemon-' && (fn = ctrl[cmd = arg.substr(9)])) {
      if (!found) {
        daemon.on('error', error).on('notrunning', notrunning).on('running', running).on('started', started).on('starting', starting).on('stopped', stopped).on('stopping', stopping);
      }
      found = true;
      fn();
    }
  }
  if (!found) {
    cb(null, true);
  }
};
