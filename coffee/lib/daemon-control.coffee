
module.exports = (daemon, name, cb) ->
  error = (err) ->
    console.error err

  notrunning = ->
    console.log msg = 'daemon is not running'
    if cmd is 'status'
      cb()
    else if cmd in ['kill', 'stop']
      cb new Error msg

  running = (pid) ->
    console.log msg = 'daemon is running: ' + name + ' (pid: ' + pid + ')'
    if cmd is 'status'
      cb()
    else if cmd is 'start'
      cb new Error msg

  starting = ->
    console.log 'starting daemon...'

  started = (pid) ->
    console.log 'started daemon: ' + name + ' (pid: ' + pid + ')'
    cb null, suggest_to_continue

  stopping = ->
    console.log 'stopping daemon...'

  stopped = (pid) ->
    console.log 'stopped daemon: ' + name + ' (pid: ' + pid + ')'
    if cmd in ['kill', 'stop']
      cb null, suggest_to_continue

  suggest_to_continue = false
  ctrl =
    kill:  ->
      daemon.kill()
    start: ->
      daemon.start()
    stop:  ->
      daemon.stop()
    reload: ->
      suggest_to_continue = true
      if pid = daemon.status()
        console.log 'sending reload signal to daemon: ' + name + ' (pid: ' +
                    pid + ')'
        daemon.sendSignal 'SIGUSR1'
      else
        daemon.start()
    restart: ->
      suggest_to_continue = true
      daemon.stop (err) ->
        daemon.start() unless err
    status: ->
      if pid = daemon.status()
        console.log 'daemon is running: ' + name + ' (pid: ' + pid + ')'
      else
        console.log 'daemon is not running'

  found = false
  cmd = null
  for arg in process.argv[2 ...]
    if arg.substr(0, 9) is '--daemon-' and fn = ctrl[cmd = arg.substr 9]
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

  unless found
    cb()
  return
