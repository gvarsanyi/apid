fs  = require 'fs'
jot = require 'json-over-tcp'

Bridge = require './bridge'


daemon_std = {}
for arg in process.argv[2 ...]
  if arg is '--daemon-stderr'
    daemon_std.err = true
  if arg is '--daemon-stdout'
    daemon_std.out = true


class Client extends Bridge
  requirePath: null # string


  constructor: (name) ->
    super
    @setConfig name


  connect: (require_path, options, cb) =>
    @requirePath = require.resolve require_path
    unless typeof options is 'object'
      [cb, options] = [options, {}]
    @setOptions options

    mkdirp = require 'mkdirp'
    mkdirp @configPath, (err) =>
      return cb(err) if err

      setup =
        cwd:     options.cwd or process.cwd()
        main:    @requirePath
        name:    @name
        pidfile: @pidFile
        silent:  true

      if options.coffeePath
        setup.coffeePath = options.coffeePath

      daemon = require('daemonize2').setup setup

      if require('./daemon-control') daemon, @name
        return # daemon control was called

      connect = =>
        handshake = 0

        @socket = jot.connect @socketFile, =>
          @revealExposed()

          @socket.on 'data', (data) =>
            # console.log 'data', data
            if data.std
              if (str = data.std.out) and (daemon_std.out or options.stdout)
                process.stdout.write '[APID STDOUT] ' + str
              if (str = data.std.err) and (daemon_std.err or options.stderr)
                process.stderr.write '[APID STDERR] ' + str
            else if data.api
              @attachRemote data
              handshake += 1
              if handshake is 2
                @readyFlush cb
            else if data.ack
              handshake += 1
              if handshake is 2
                @readyFlush cb
            else if data.req
              @request data.req
            else
              @response data?.res

      buffer_count = 0
      buffer = =>
        fs.exists @socketFile, (exists) ->
          if exists or buffer_count > 50
            setTimeout connect, 1
          else
            buffer_count += 1
            setTimeout buffer, 10

      daemon
      .on('started', buffer)
      .on('running', connect)
      .on('error', (err) -> throw err)

      daemon.start()


module.exports = Client
