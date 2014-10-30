jot = require 'json-over-tcp'

exposed_api = require './exposed-api'
remote_api  = require './remote-api'


module.exports.connect = (port, callback) ->

  handshake = 0

  socket = jot.connect port, ->
    exposed_api.reveal socket

    socket.on 'data', (data) ->
      # console.log 'data', data
      if data.api
        remote_api.attach data.api, socket
        handshake += 1
        if handshake is 2
          callback?()
      else if data.ack
        handshake += 1
        if handshake is 2
          callback?()
      else if data.req
        exposed_api.request data.req, socket
      else
        remote_api.response data?.res
