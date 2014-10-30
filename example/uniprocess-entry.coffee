apid = require '../js/apid'


apid.expose 'sum', (a, b, cb) ->
  cb null, a + b

apid.expose 'sumWithPing', (a, b, cb) ->
  console.log 'request: sum(a, b) : ', a, b
  console.log 'pinging before responding', (new Date).getTime()
  cb.remote.ping (err, res) ->
    console.log 'ping response:', res, (new Date).getTime()
    console.log 'responding: cb(null, a + b) :', a + b
    cb null, a + b


apid 'exampleapid', false, (err) ->
  console.log 'server ready', err, apid.exposed
