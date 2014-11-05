console.time 'init'
apid = require '../../js/apid'
console.timeEnd 'init'


apid.session.clientSessionX = 2


err_check = (err) ->
  if err
    throw err


console.time 'connect'
apid 'exampleapid', __dirname + '/uniprocess-entry.coffee.js', ->
  console.timeEnd 'connect'
  # console.log 'remote API:', apid.remote

  unless apid.remoteSession?.serverSessionX is 1
    throw new Error 'apid.remoteSession.serverSessionX is supposed to be 1'

  console.log 'apid.remote.sum(2, 5)'
  apid.remote.sum 2, 5, (err, sum) ->
    err_check err
    unless sum is 7
      throw new Error 'sum(2, 5) was supposed to return 7'

    console.log 'apid.remote.sumWithPing(3, 4)'
    apid.remote.sumWithPing 3, 4, (err, sum, client_session) ->
      err_check err
      unless sum is 7
        throw new Error 'sumWithPing(3, 4) was supposed to return 7'
      unless client_session.clientSessionX is 2
        throw new Error 'client_session.clientSessionX was supposed to be 2'

      console.log 'apid.remote.math.dupe(3.5)'
      apid.remote.math.dupe 3.5, (err, res) ->
        err_check err
        unless res is 7
          throw new Error 'apid.remote.math.dupe(3.5) was supposed to return 7'

        console.log 'apid.remote.errTest1()'
        apid.remote.errTest1 (err) ->
          unless err.message is 'string of errTest1!'
            console.error typeof err, err, err.message
            throw new Error 'Error string mismatch'

          console.log 'apid.remote.errTest2()'
          apid.remote.errTest2 (err) ->
            unless err.message is 'string of errTest2!'
              console.error typeof err, err, err.message
              throw new Error 'Error string mismatch'

            console.log 'apid.remote.errTestString()'
            apid.remote.errTestString (err) ->
              unless err is 'string of errTestString!'
                console.error typeof err, err, err.message
                throw new Error 'Error type mismatch'

              console.log 'DONE'
              process.exit 0
