fs  = require 'fs'
jot = require 'json-over-tcp'

Bridge = require './bridge'


class Server extends Bridge
  jotServer: null # jotServer


  constructor: ->
    super

  divertExit: =>
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

  divertStdOutput: (cb) =>
    mkdirp = require 'mkdirp'
    mkdirp @configPath, (err) =>
      file = @configPath + '/apid-' + process.getuid() + '.'
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
      cb()

  start: (name, options, cb) =>
    unless typeof options is 'object'
      [cb, options] = [options, {}]
    @setConfig name, options
#     process.title = @name

    @divertExit()
    @divertStdOutput =>

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
