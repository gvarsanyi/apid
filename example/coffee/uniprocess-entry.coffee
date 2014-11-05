apid = require '../../js/apid'

exposable =
  math:
    dupe: (n, cb) ->
      cb null, n * 2
  sum: (a, b, cb) ->
    try # should not fail w/o a callback
      cb.log 'this is a server-triggered log'
    catch err
      return cb err
    cb.errorLog 'this is a server-triggered error log', -> # has callback
      cb null, a + b
  errTest1: (cb) ->
    throw new Error 'string of errTest1!'
  errTest2: (cb) ->
    cb new Error 'string of errTest2!'
  errTestString: (cb) ->
    cb 'string of errTestString!'


apid.expose exposable

apid.session.serverSessionX = 1


apid.expose 'sumWithPing', (a, b, cb) ->
  cb.remote.ping (err, res) ->
    cb null, a + b, cb.session


apid.server 'exampleapid', (err) ->
  console.log 'server ready', err, apid.exposed
