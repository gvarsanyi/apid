
module.exports = (obj, space) ->
  cache = []
  fn = (key, value) ->
    if typeof value is 'object' and value
      unless cache.indexOf(value) is -1
        return # skip circular reference
      cache.push value
    value

  JSON.stringify obj, fn, space
