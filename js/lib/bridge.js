var Bridge, ExposedApi,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __hasProp = {}.hasOwnProperty;

ExposedApi = require('./exposed-api');

Bridge = (function(_super) {
  __extends(Bridge, _super);

  Bridge.prototype.configPath = null;

  Bridge.prototype.name = null;

  Bridge.prototype.options = null;

  Bridge.prototype.socket = null;

  function Bridge() {
    this.setOptions = __bind(this.setOptions, this);
    this.setConfig = __bind(this.setConfig, this);
    Bridge.__super__.constructor.apply(this, arguments);
    this.options = {};
  }

  Bridge.prototype.setConfig = function(_at_name, options) {
    var home;
    this.name = _at_name;
    if (options != null) {
      this.setOptions(options);
    }
    home = process.env.HOME;
    if (process.platform === 'win32') {
      home = process.env.USERPROFILE;
    }
    this.configPath = home + '/.config/' + this.name;
    this.socketFile = this.configPath + '/apid-' + process.getuid() + '.socket';
    return this.pidFile = this.configPath + '/apid-' + process.getuid() + '.pid';
  };

  Bridge.prototype.setOptions = function(options) {
    var key, value;
    for (key in options) {
      value = options[key];
      this.options[key] = value;
    }
  };

  return Bridge;

})(ExposedApi);

module.exports = Bridge;
