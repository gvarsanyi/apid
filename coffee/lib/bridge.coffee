
ExposedApi = require './exposed-api'


class Bridge extends ExposedApi
  configPath: null
  name:       null # String
  options:    null # {}
  socket:     null # Socket


  constructor: ->
    super
    @options = {}

  setConfig: (@name, options) =>
    if options?
      @setOptions options

    home = process.env.HOME
    if process.platform is 'win32'
      home = process.env.USERPROFILE
    @configPath = home + '/.config/' + name
    @socketFile = @configPath + '/apid-' + process.getuid() + '.socket'
    @pidFile    = @configPath + '/apid-' + process.getuid() + '.pid'


  setOptions: (options) =>
    for key, value of options
      @options[key] = value
    return


module.exports = Bridge
