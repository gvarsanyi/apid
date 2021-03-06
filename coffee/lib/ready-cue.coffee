
class ReadyCue
  ready:    false
  readyCue: null # []

  onReady: (cb) =>
    if @ready
      return cb()
    (@readyCue ?= []).push cb
    @ready

  readyFlush: (cb) =>
    @ready = true
    while fn = (@readyCue ?= []).shift()
      fn()
    cb?()


module.exports = ReadyCue
