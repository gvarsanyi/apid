callbax = require 'callbax'

RemoteApi = require './remote-api'
stringify = require './stringify'


class ExposedApi extends RemoteApi
  exposed: null # {}
  session: null # {}


  constructor: ->
    super
    @exposed =
      console:
        log: (args..., cb) ->
          console.log args...
          cb()
        error: (args..., cb) ->
          console.error args...
          cb()

      ping: (cb) ->
        cb null, 'pong'

    @session = {}

  expose: (keys..., fn) =>
    if fn and typeof fn is 'object'
      return @exposeHash fn, keys

    unless typeof fn is 'function'
      throw new Error 'Attached API interfaces must be functions (' + key + ')'

    key_check = (key) ->
      unless (key or key is 0) and typeof key in ['string', 'number']
        throw new Error 'Invalid API name: ' + keys.join '.'

    target = @exposed
    key_check last_key = keys[keys.length - 1]
    if keys.length > 1
      for key in keys[0 ... keys.length - 1]
        key_check key
        target = (target[key] ?= {})

    target[last_key] = fn

    # console.log 'exposed: ', keys.join '.'
    # console.log 'new api layout:\n', api
    return

  exposeHash: (src, keys) =>
    # console.log 'src, keys ::', src, keys
    for key, ref of src
      new_keys = (item for item in keys)
      new_keys.push key
      @expose new_keys..., ref
    return

  revealExposed: =>
    copy_to_map = (src, target) ->
      for key, node of src
        if node and typeof node is 'object'
          copy_to_map node, (target[key] = {})
        else
          target[key] = 1
      return

    copy_to_map @exposed, (map = {})

    @socket.write {api: map, session: @session}

  request: (req) =>
    cb = @wrapCallback (args...) =>
      msg = res: {id: req.id}
      if args.length
        for arg, i in args when arg instanceof Error
          (msg.res.errType ?= []).push i
          args[i] = arg.message
        msg.res.args = stringify args
      @socket.write msg

    try
      unless req?.id >= 1
        throw new Error 'dropping request with invalid req id:' + req.id

      if (args = req.args)?
        args = JSON.parse args
        unless Array.isArray(args) and args.length
          throw new Error 'Invalid arguments: ' + req.args

      functions = (item for item in req.fn)
      target_fn = @exposed
      while functions.length
        unless (target_fn = target_fn[functions.shift()])
          throw new Error 'No such exposed method: ' + req.fn

      unless typeof target_fn is 'function'
        throw new Error 'No such exposed method: ' + req.fn
    catch err
      console.error 'failed request', req, err, err.stack
      cb err

    try
      if args
        target_fn args..., cb
      else
        target_fn cb
    catch err
      cb err

  wrapCallback: (cb) =>
    cb = callbax cb
    cb.remote  = @remote
    cb.session = @remoteSession
    cb


module.exports = ExposedApi
