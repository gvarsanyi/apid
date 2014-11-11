
Client = require './lib/client'
Server = require './lib/server'


clients = {}

class Apid
  @client: (name) ->
    clients[name] ?= new Client name
    clients[name]

  @server: new Server


module.exports = Apid
