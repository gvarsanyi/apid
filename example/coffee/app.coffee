console.time 'init'
apid = require '../../js/apid'
console.timeEnd 'init'

apid.session.clientSessionX = 2

console.time 'connect'
apid 'exampleapid', __dirname + '/uniprocess-entry.coffee.js', ->
  console.timeEnd 'connect'
  console.log 'remote API:', apid.remote

  console.log 'apid.remoteSession', apid.remoteSession

  console.time 'sum'
  apid.remote.sum 2, 5, (err, sum) ->
    console.timeEnd 'sum'
    console.log 'sum(2, 5):', err, sum

    console.time 'sumWithPing'
    apid.remote.sumWithPing 3, 4, (err, sum, client_session) ->
      console.timeEnd 'sumWithPing'
      console.log 'sumWithPing(3, 4) :', err, sum
      console.log 'returned client_session:', client_session

      console.time 'math.dupe'
      apid.remote.math.dupe 3.5, (err, res) ->
        console.timeEnd 'math.dupe'
        console.log 'math.dupe(3.5) :', err, res

        process.exit 1
