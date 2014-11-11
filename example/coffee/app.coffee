console.time 'init'
apid = require '../../coffee/apid'


client = apid.client 'exampleapid'
remote = client.remote
console.timeEnd 'init'


client.session.clientSessionX = 2


err_check = (err) ->
  if err
    throw err


console.time 'connect'
client.connect __dirname + '/uniprocess-entry.coffee', ->
  console.timeEnd 'connect'
  # console.log 'remote API:', client.remote

  unless client.remoteSession?.serverSessionX is 1
    throw new Error 'client.remoteSession.serverSessionX is supposed to be 1'

  console.log 'remote.sum(2, 5)'
  remote.sum 2, 5, (err, sum) ->
    err_check err
    unless sum is 7
      throw new Error 'sum(2, 5) was supposed to return 7'

    console.log 'remote.sumWithPing(3, 4)'
    remote.sumWithPing 3, 4, (err, sum, client_session) ->
      err_check err
      unless sum is 7
        throw new Error 'sumWithPing(3, 4) was supposed to return 7'
      unless client_session.clientSessionX is 2
        throw new Error 'client_session.clientSessionX was supposed to be 2'

      console.log 'remote.math.dupe(3.5)'
      remote.math.dupe 3.5, (err, res) ->
        err_check err
        unless res is 7
          throw new Error 'remote.math.dupe(3.5) was supposed to return 7'

        console.log 'remote.errTest1()'
        remote.errTest1 (err) ->
          unless err.message is 'string of errTest1!'
            console.error typeof err, err, err.message
            throw new Error 'Error string mismatch'

          console.log 'remote.errTest2()'
          remote.errTest2 (err) ->
            unless err.message is 'string of errTest2!'
              console.error typeof err, err, err.message
              throw new Error 'Error string mismatch'

            console.log 'remote.errTestString()'
            remote.errTestString (err) ->
              unless err is 'string of errTestString!'
                console.error typeof err, err, err.message
                throw new Error 'Error type mismatch'

              console.log 'DONE'
              process.exit 0
