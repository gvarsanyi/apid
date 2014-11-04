exposed_api = require './lib/exposed-api'
remote_api  = require './lib/remote-api'


started   = false
ready     = false
ready_cue = []


apid = (name_id, entry, callback) ->
  if started
    callback?()
    return
  started = true

  unless name_id and typeof name_id is 'string'
    throw new Error 'name_id (first argument) must be a string with contents'

  unless (entry and typeof entry is 'string') or entry is false
    throw new Error 'entry (second argument) must be a file name string'

  unless not callback? or typeof callback is 'function'
    throw new Error 'callback (last argument) must be a function'

  home = process.env.HOME
  if process.platform is 'win32'
    home = process.env.USERPROFILE
  home += '/.config/' + name_id
  file = home + '/apid-' + process.getuid()


  mkdirp = require 'mkdirp'
  mkdirp home, (err) ->
    connected = ->
      apid.ready = ready = true
      while cb = ready_cue.pop()
        cb()
      callback?()

    if entry # client bootstrap
      connect = (pid) ->
        client = require './lib/client'
        client.connect file + '.sock', connected

      daemon = require('daemonize2').setup
        main:    entry
        name:    name_id
        pidfile: file + '.pid'
        silent:  true

      if require('./lib/daemon-control') daemon, name_id
        return # daemon control was called

      daemon
      .on('started', connect)
      .on('running', connect)
      .on('error', (err) -> throw err)

      daemon.start()
    else
      fs = require 'fs'
      opts = {encoding: 'utf8', flags: 'a'}

      _std_streams = {}
      for type in ['err', 'out']
        do (type) ->
          process['std' + type].write = (d) ->
            unless _std_streams[type]
              _std_streams[type] = fs.createWriteStream file + '.' + type, opts
              _std_streams[type].once 'close', ->
                _std_streams[type] = null
              _std_streams[type].once 'error', ->
                _std_streams[type] = null

            _std_streams[type].write d

      server = require './lib/server'
      server.start file + '.sock', connected

  return


apid.expose  = exposed_api.expose

apid.exposed = exposed_api.api

apid.session = exposed_api.session

apid.remote  = remote_api.api
apid.remoteSession = remote_api.session

apid.ready   = ready

apid.onReady = (callback) ->
  if ready
    callback()
  ready_cue.push callback
  ready

apid.server = (name_id, callback) ->
  apid name_id, false, callback


module.exports = apid
