callbax = require 'callbax'

ReadyCue  = require './ready-cue'
stringify = require './stringify'


class RemoteApi extends ReadyCue
  remote:        null # {}
  remoteCallId:  0
  remoteCalls:   null # {}
  remoteSession: null # {}


  constructor: ->
    super
    @remote        = {}
    @remoteCalls   = {}
    @remoteSession = {}

  attachRemote: (data) =>
    target         = @remote
    target_session = @remoteSession

    functionize = (keys) =>
      callbax (args..., cb) =>
        unless typeof cb is 'function'
          throw new Error 'Callback function is required as last argument'

        callback_id = (@remoteCallId += 1)
        (callbacks = @remoteCalls)[callback_id] = cb

        try
          msg = req: {id: callback_id, fn: keys}
          if args.length
            msg.req.args = stringify args
          @socket.write msg
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

  connectionLost: (remote_name) =>
    for id, cb of @remoteCalls
      delete @remoteCalls[id]
      cb new Error 'Connection to ' + remote_name + ' closed'
    return

  response: (res) =>
    callbacks = @remoteCalls
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


module.exports = RemoteApi
