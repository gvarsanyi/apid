callbax = null

callback_id = 0
callbacks   = {}


module.exports.api     = api     = {}
module.exports.session = session = {}


module.exports.attach = (data, socket, target=api, target_session=session) ->
  callbax ?= require 'callbax'


  functionize = (keys) ->
    callbax (args..., cb) ->
      unless typeof cb is 'function'
        throw new Error 'Callback function is required as last argument'

      callback_id += 1
      callbacks[callback_id] = cb

      try
        msg = req: {id: callback_id, fn: keys}
        if args.length
          msg.req.args = JSON.stringify args
        socket.write msg

      catch err
        console.error 'error requesting:', err
        if cb = callbacks[callback_id]
          delete callbacks[callback_id]
          cb err

  copy_to_api = (src, target, keys=[]) ->
    for key, node of src
      new_keys = (item for item in keys)
      new_keys.push key
      if node and typeof node is 'object'
        copy_to_api node, (target[key] = {}), new_keys
      else
        target[key] = functionize new_keys
    return

  for key of target
    delete target[key]
  copy_to_api data.api, target

  for key of target_session
    delete target_session[key]
  for key, value of data.session or {}
    target_session[key] = value

  # console.log 'api/target', target, target_session, map
  return


module.exports.response = (res) ->
  unless res?.id >= 1 and cb = callbacks[res.id]
    console.error 'dropping unparsible response:', res

  delete callbacks[res.id]

  if res.args?.length
    args = JSON.parse res.args
    for i in res.errType or []
      args[i] = new Error args[i]

    cb args...
  else
    cb()
