
module.exports.api = api = {}

# ping function is always exposed
api.ping = (cb) ->
  cb null, 'pong'


expose_hash = (src, keys) ->
  console.log 'src, keys ::', src, keys
  for key, ref of src
    new_keys = (item for item in keys)
    new_keys.push key
    expose new_keys..., ref
  return


module.exports.expose = expose = (keys..., fn) ->
  if fn and typeof fn is 'object'
    return expose_hash fn, keys

  unless typeof fn is 'function'
    throw new Error 'Attached API interfaces must be functions (' + key + ')'

  key_check = (key) ->
    unless (key or key is 0) and typeof key in ['string', 'number']
      throw new Error 'Invalid API name: ' + keys.join '.'

  target = api
  key_check last_key = keys[keys.length - 1]
  if keys.length > 1
    for key in keys[0 ... keys.length - 1]
      key_check key
      target = (target[key] ?= {})

  target[last_key] = fn

  # console.log 'exposed: ', keys.join '.'
  # console.log 'new api layout:\n', api
  return


module.exports.reveal = (socket) ->
  copy_to_map = (src, target) ->
    for key, node of src
      if node and typeof node is 'object'
        copy_to_map node, (target[key] = {})
      else
        target[key] = 1
    return

  copy_to_map api, (map = {})

  socket.write api: map


module.exports.request = (req, socket, target) ->
  cb = (args...) ->
    msg = res: {id: req.id}
    if args.length
      msg.res.args = JSON.stringify args
    socket.write msg
  if target
    cb.remote = target

  try
    unless req?.id >= 1
      throw new Error 'dropping request with invalid req id:' + req.id

    if (args = req.args)?
      args = JSON.parse args
      unless Array.isArray(args) and args.length
        throw new Error 'Invalid arguments: ' + req.args

    fn = (item for item in req.fn)
    target = api
    while fn.length
      unless (target = target[fn.shift()])
        throw new Error 'No such exposed method: ' + req.fn

    unless typeof target is 'function'
      throw new Error 'No such exposed method: ' + req.fn

    if args
      target args..., cb
    else
      target cb
  catch err
    console.error 'failed request', req, err
    cb err
