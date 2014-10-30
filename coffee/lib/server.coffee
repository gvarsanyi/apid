jot = require 'json-over-tcp'

exposed_api = require './exposed-api'
remote_api  = require './remote-api'


module.exports.start = (port, callback) ->

  cleaned_up = false
  for event in ['exit', 'SIGINT', 'SIGTERM', 'SIGHUP', 'SIGBREAK']
    do (event) ->
      process.on event, (args...) ->
        console.log 'Event:', event, args...
        unless cleaned_up or port > 1
          console.log 'unlinking', port
          try
            fs = require 'fs'
            fs.unlink port
            cleaned_up = true
        unless event is 'exit'
          process.exit 0


  server = jot.createServer port

  server.on 'listening', ->
    console.log 'server listening on:', port
    callback?()

  server.on 'connection', (socket) ->
    client_api = {}

    exposed_api.reveal socket

    socket.on 'data', (data) ->
      # console.log 'data', data
      if data.api
        remote_api.attach data.api, socket, client_api
        socket.write {ack: 1}
      else if data.req
        exposed_api.request data.req, socket, client_api
      else
        remote_api.response data?.res


  server.listen port
