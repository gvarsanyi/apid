apid = require '../../coffee/apid'


client = apid.client 'apid-example'
remote = client.remote


client.session.clientSessionX = 2


err_check = (condition, msg) ->
  if condition? and typeof condition is 'object'
    console.error condition
    process.exit 1
  if msg and not condition
    console.error 'Error:', msg
    process.exit 1


client.status (err, pid) ->
  err_check !!err or pid, '#0'

  client.connect __dirname + '/daemon.coffee', ->
    # console.log 'remote API:', client.remote

    err_check client.remoteSession?.serverSessionX is 1, '#1'

    remote.sum 2, 5, (err, sum) ->
      err_check err
      err_check sum is 7, '#2'

      remote.sumWithPing 3, 4, (err, sum, client_session) ->
        err_check err
        err_check sum is 7, '#3'
        err_check client_session.clientSessionX is 2, '#4'

        remote.math.dupe 3.5, (err, res) ->
          err_check err
          err_check res is 7, '#5'

          remote.errTest1 (err) ->
            err_check err?.message is 'string of errTest1!', '#6'

            remote.errTest2 (err) ->
              err_check err?.message is 'string of errTest2!', '#7'

              remote.errTestString (err) ->
                err_check err is 'string of errTestString!', '#8'

                client.status (err, pid) ->
                  err_check err
                  err_check pid, '#9'

                  console.log 'test #2 DONE'
                  process.exit 0
