fs  = require 'fs'
jot = require 'json-over-tcp'

Bridge = require './bridge'


exposed_socket = null


class Server extends Bridge
  jotServer:    null # jotServer
  onConnectCue: null # []


  constructor: ->
    @onConnectCue = []
    super


  start: (name, options, cb) =>
    unless typeof options is 'object'
      [cb, options] = [options, {}]
    @setConfig name, options

    @jotServer = jot.createServer @socketFile

    @jotServer.on 'listening', =>
      console.log 'server listening on:', @socketFile
      @readyFlush cb

    @jotServer.on 'connection', (@socket) =>
      @revealExposed()

      exposed_socket = socket

      socket.on 'data', (data) =>
        # console.log 'data', data
        if data.api
          @attachRemote data
          while fn = @onConnectCue.shift()
            fn()
          socket.write ack: 1
        else if data.req
          @request data.req
        else
          @response data?.res

    @jotServer.on 'error', (err) =>
      if err.code is 'EADDRINUSE' # need some clean-up
        fs.unlink @socketFile, (unlink_err) =>
          if unlink_err
            console.error unlink_err.stack
            console.error err.stack
            process.exit 1
          @jotServer.listen @socketFile
      else
        throw err

    @jotServer.listen @socketFile

  onConnect: (fn) =>
    @onConnectCue.push fn
    return

module.exports = Server


# Server only: divert STDOUT/STDERR to files and hijack exit processes
# Output files: ~/.config/<ID>/apid.out and ~/.config/<ID>/apid.err
do ->
  fn = process.mainModule.filename
  if fn.indexOf('node_modules/daemonize2/lib/wrapper.js') is fn.length - 38
    name = process.title

    home = process.env.HOME
    if process.platform is 'win32'
      home = process.env.USERPROFILE

    unless name and home
      throw new Error 'APID can not find environment values for home|name: ' +
                      home + '|' + name

    config_path = home + '/.config/' + name

    require('mkdirp').sync config_path

    # divert stdout/stderr
    file = config_path + '/apid-' + process.getuid() + '.'
    opts = {encoding: 'utf8', flags: 'a'}
    fd = {}
    for type in ['err', 'out']
      do (type) ->
        process['std' + type].write = (d) ->
          if exposed_socket
            (inf = {})[type] = d
            try
              exposed_socket.write std: inf
          try
            fd[type] ?= fs.openSync file + type, 'a'
          try
            fs.writeSync fd[type], d
          catch # see if the file can be re-opened
            fd[type] = fs.openSync file + type, 'a'
            try
              fs.writeSync fd[type], d

    # divert exit processes
    cleaned_up  = false
    socket_file = config_path + '/apid-' + process.getuid() + '.socket'
    for event in ['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGBREAK', 'exit',
                  'uncaughtException']
      do (event) ->
        process.on event, (args...) =>
          unless cleaned_up and socket_file
            # console.log 'unlinking', socket_file
            try
              fs.unlink socket_file
              for type in ['err', 'out'] when fd[type]
                fs.closeSync fd[type]
                delete fd[type]
              cleaned_up = true

          if event is 'uncaughtException'
            console.error '[PROCESS EVENT] uncaughtException\n' + args[0].stack
          else
            console.log '[PROCESS EVENT]', event, args...

          unless event is 'exit'
            exit_code = if event is 'uncaughtException' then 1 else 0
            process.exit exit_code

    return
