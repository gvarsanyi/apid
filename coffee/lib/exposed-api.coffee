
module.exports.api = api = {}

# ping function is always exposed
api.ping = (cb) ->
  cb null, 'pong'


module.exports.expose = (key, fn) ->
  unless typeof fn is 'function'
    throw new Error 'Attached API interfaces must be functions (' + key + ')'
  unless typeof key in ['string', 'number']
    throw new Error 'Invalid API name: ' + key
  # console.log 'exposed: ', key
  api[key] = fn


module.exports.reveal = (socket) ->
  list = []
  for key of api
    unless typeof api[key] is 'function'
      throw new Error 'Attached API interfaces must be functions (' + key + ')'
    list.push key
  socket.write api: list


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

    unless typeof api[req.fn] is 'function'
      throw new Error 'No such exposed method: ' + req.fn

    if args
      api[req.fn] args..., cb
    else
      api[req.fn] cb
  catch err
    console.error 'failed request', req, err
    cb err
