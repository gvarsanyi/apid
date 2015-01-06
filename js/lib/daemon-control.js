module.exports = function(daemon, name) {
  var arg, ctrl, error, fn, found, notrunning, running, started, starting, stopped, stopping, _i, _len, _ref;
  error = function(err) {
    return console.error(err);
  };
  notrunning = function() {
    return console.log('daemon is not running');
  };
  running = function(pid) {
    return console.log('daemon is running: ' + name + ' (pid: ' + pid + ')');
  };
  starting = function() {
    return console.log('starting daemon...');
  };
  started = function(pid) {
    return console.log('started daemon: ' + name + ' (pid: ' + pid + ')');
  };
  stopping = function() {
    return console.log('stopping daemon...');
  };
  stopped = function(pid) {
    return console.log('stopped daemon: ' + name + ' (pid: ' + pid + ')');
  };
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
      if (pid = daemon.status()) {
        console.log('sending reload signal to daemon: ' + name + ' (pid: ' + pid + ')');
        return daemon.sendSignal('SIGUSR1');
      } else {
        return daemon.start();
      }
    },
    restart: function() {
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
  _ref = process.argv.slice(2);
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    arg = _ref[_i];
    if (arg.substr(0, 9) === '--daemon-' && (fn = ctrl[arg.substr(9)])) {
      if (!found) {
        daemon.on('error', error).on('notrunning', notrunning).on('running', running).on('started', started).on('starting', starting).on('stopped', stopped).on('stopping', stopping);
      }
      found = true;
      fn();
    }
  }
  return found;
};
