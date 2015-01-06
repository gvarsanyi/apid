var ReadyCue,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ReadyCue = (function() {
  ReadyCue.prototype.ready = false;

  ReadyCue.prototype.readyCue = null;

  function ReadyCue() {
    this.readyFlush = __bind(this.readyFlush, this);
    this.onReady = __bind(this.onReady, this);
    this.readyCue = [];
  }

  ReadyCue.prototype.onReady = function(cb) {
    if (this.ready) {
      return cb();
    }
    this.readyCue.push(cb);
    return this.ready;
  };

  ReadyCue.prototype.readyFlush = function(cb) {
    var fn;
    this.ready = true;
    while (fn = this.readyCue.shift()) {
      fn();
    }
    return typeof cb === "function" ? cb() : void 0;
  };

  return ReadyCue;

})();

module.exports = ReadyCue;