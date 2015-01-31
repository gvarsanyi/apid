fs  = require 'fs'
jot = require 'json-over-tcp'

Bridge     = require './bridge'
ExposedApi = require './exposed-api'
ReadyCue   = require './ready-cue'


exposed_sockets = []


class Server extends ReadyCue
  jotServer:    null # jotServer
  onConnectFns: null # []

  # for Bridge
  configPath: null
  name:       null # String
  options:    null # {}

  # for ExposedApi
  exposed: null # {}
  session: null # {}


  constructor: ->
    @onConnectFns = []

    # for ExposedApi
    @exposed = {}
    @session = {}

    # for Bridge
    @options = {}

  # for ExposedApi
  expose:     ExposedApi::expose
  exposeHash: ExposedApi::exposeHash

  # for Bridge
  setConfig:  Bridge::setConfig
  setOptions: Bridge::setOptions

  start: (name, options, cb) =>
    unless typeof options is 'object'
      [cb, options] = [options, {}]
    @setConfig name, options

    @jotServer = jot.createServer @socketFile

    @jotServer.on 'listening', =>
      console.log 'server listening on:', @socketFile
      @readyFlush cb

    @jotServer.on 'connection', (socket) =>
      bridge = new Bridge
      bridge.setConfig name, options
      bridge.expose @exposed
      bridge.session = @session
      bridge.socket = socket
      bridge.revealExposed()

      exposed_sockets.push socket

      socket.on 'data', (data) =>
        # console.log 'data', data
        if data.api
          bridge.attachRemote data
          for fn in @onConnectFns
            fn bridge.wrapCallback ->
          socket.write ack: 1
        else if data.req
          bridge.request data.req
        else
          bridge.response data?.res

      socket.on 'error', (err) ->
        # trigger silent close by catching errors. Followed by 'close' event.

      socket.on 'close', =>
        console.log '[CLOSE]'
        bridge.connectionLost 'client'

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
    @onConnectFns.push fn
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
          if exposed_sockets.length
            (inf = {})[type] = d
            for exposed_socket in exposed_sockets
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
