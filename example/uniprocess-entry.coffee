apid = require '../js/apid'

exposable =
  math:
    dupe: (n, cb) ->
      cb null, n * 2
  sum: (a, b, cb) ->
    cb null, a + b

apid.expose exposable

apid.expose 'sumWithPing', (a, b, cb) ->
  cb.remote.ping (err, res) ->
    cb null, a + b


apid 'exampleapid', false, (err) ->
  console.log 'server ready', err, apid.exposed
