
callback_id = 0
callbacks   = {}


module.exports.api = api = {}


module.exports.attach = (keys, socket, target=api) ->
  for key in keys
    do (key) ->
      target[key] = (args..., cb) ->
        unless typeof cb is 'function'
          throw new Error 'Callback function is required as last argument'

        callback_id += 1
        callbacks[callback_id] = cb

        try
          msg = req: {id: callback_id, fn: key}
          if args.length
            msg.req.args = JSON.stringify args
          socket.write msg

        catch err
          console.error 'error requesting:', err
          if cb = callbacks[callback_id]
            delete callbacks[callback_id]
            cb err
  return


module.exports.response = (res) ->
  unless res?.id >= 1 and cb = callbacks[res.id]
    console.error 'dropping unparsible response:', res

  delete callbacks[res.id]

  if res.args?.length
    cb JSON.parse(res.args)...
  else
    cb()
