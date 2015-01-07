jot = require 'json-over-tcp'

Bridge = require './bridge'


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
            if data.api
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

      daemon
      .on('started', connect)
      .on('running', connect)
      .on('error', (err) -> throw err)

      daemon.start()



module.exports = Client
