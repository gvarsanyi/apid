console.time 'init'
apid = require '../js/apid'
console.timeEnd 'init'

console.time 'connect'
apid 'exampleapid', __dirname + '/uniprocess-entry.coffee.js', ->
  console.timeEnd 'connect'
  console.log 'connected', apid.remote

  console.time 'sum'
  apid.remote.sum 2, 5, (err, sum) ->
    console.timeEnd 'sum'
    console.log 'response:', err, sum

    console.time 'sumWithPing'
    apid.remote.sumWithPing 3, 4, (err, sum) ->
      console.timeEnd 'sumWithPing'
      console.log 'response:', err, sum

      process.exit 1