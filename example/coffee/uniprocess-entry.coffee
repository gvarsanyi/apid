apid = require '../../js/apid'

exposable =
  math:
    dupe: (n, cb) ->
      cb null, n * 2
  sum: (a, b, cb) ->
    cb null, a + b

apid.expose exposable

apid.session.serverSessionX = 1


apid.expose 'sumWithPing', (a, b, cb) ->
  cb.remote.ping (err, res) ->
    cb null, a + b, cb.session


apid.server 'exampleapid', (err) ->
  console.log 'server ready', err, apid.exposed
