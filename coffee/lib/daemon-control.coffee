
module.exports = (daemon, name) ->
  error = (err) ->
    console.error err

  notrunning = ->
    console.log 'daemon is not running'

  running = (pid) ->
    console.log 'daemon is running: ' + name + ' (pid: ' + pid + ')'

  starting = ->
    console.log 'starting daemon...'

  started = (pid) ->
    console.log 'started daemon: ' + name + ' (pid: ' + pid + ')'

  stopping = ->
    console.log 'stopping daemon...'

  stopped = (pid) ->
    console.log 'stopped daemon: ' + name + ' (pid: ' + pid + ')'

  ctrl =
    kill:  ->
      daemon.kill()
    start: ->
      daemon.start()
    stop:  ->
      daemon.stop()
    reload: ->
      if pid = daemon.status()
        console.log 'sending reload signal to daemon: ' + name + ' (pid: ' +
                    pid + ')'
        daemon.sendSignal 'SIGUSR1'
      else
        daemon.start()
    restart: ->
      daemon.stop (err) ->
        daemon.start() unless err
    status: ->
      if pid = daemon.status()
        console.log 'daemon is running: ' + name + ' (pid: ' + pid + ')'
      else
        console.log 'daemon is not running'

  found = false
  for arg in process.argv[2 ...]
    if arg.substr(0, 9) is '--daemon-' and fn = ctrl[arg.substr 9]
      unless found
        daemon
        .on('error', error)
        .on('notrunning', notrunning)
        .on('running', running)
        .on('started', started)
        .on('starting', starting)
        .on('stopped', stopped)
        .on('stopping', stopping)
      found = true
      fn()

  found
