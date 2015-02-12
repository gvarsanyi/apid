apid = require '../../coffee/apid'


server = apid.server


exposable =
  math:
    dupe: (n, cb) ->
      cb null, n * 2
  sum: (a, b, cb) ->
    try # should not fail w/o a callback
      cb.remote.console.log 'this is a server-triggered log'
    catch err
      return cb err
    cb.remote.console.error 'this is a server-triggered error log', -> # has callback
      cb null, a + b
  errTest1: (cb) ->
    throw new Error 'string of errTest1!'
  errTest2: (cb) ->
    cb new Error 'string of errTest2!'
  errTestString: (cb) ->
    cb 'string of errTestString!'


server.expose exposable

server.session.serverSessionX = 1


server.expose 'sumWithPing', (a, b, cb) ->
  cb.remote.ping (err, res) ->
    cb null, a + b, cb.session


server.start 'apid-example', (err) ->
  console.log 'server ready', err or ''
