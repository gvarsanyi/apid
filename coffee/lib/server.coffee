fs  = require 'fs'
jot = require 'json-over-tcp'

Bridge = require './bridge'


class Server extends Bridge
  jotServer: null # jotServer


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

      socket.on 'data', (data) =>
        # console.log 'data', data
        if data.api
          @attachRemote data
          socket.write ack: 1
        else if data.req
          @request data.req
        else
          @response data?.res

    @jotServer.listen @socketFile


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
    std_streams = {}
    for type in ['err', 'out']
      do (type) ->
        process['std' + type].write = (d) ->
          unless std_streams[type]
            std_streams[type] = fs.createWriteStream file + type, opts
            std_streams[type].once 'close', ->
              std_streams[type] = null
            std_streams[type].once 'error', ->
              std_streams[type] = null

          std_streams[type].write d

    # divert exit processes
    cleaned_up = false
    for event in ['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGBREAK', 'exit',
                  'uncaughtException']
      do (event) =>
        process.on event, (args...) =>
          console.log 'Event:', event, args...
          unless cleaned_up and @socketFile
            console.log 'unlinking', @socketFile
            try
              fs.unlink @socketFile
              cleaned_up = true
          unless event is 'exit'
            process.exit 0

    return
