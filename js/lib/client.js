// Generated by CoffeeScript 1.7.1
var exposed_api, jot, remote_api;

jot = require('json-over-tcp');

exposed_api = require('./exposed-api');

remote_api = require('./remote-api');

module.exports.connect = function(port, callback) {
  var handshake, socket;
  handshake = 0;
  return socket = jot.connect(port, function() {
    exposed_api.reveal(socket);
    return socket.on('data', function(data) {
      if (data.log) {
        return console.log.apply(console, JSON.parse(data.log));
      } else if (data.errorLog) {
        return console.error.apply(console, JSON.parse(data.errorLog));
      } else if (data.api) {
        remote_api.attach(data, socket);
        handshake += 1;
        if (handshake === 2) {
          return typeof callback === "function" ? callback() : void 0;
        }
      } else if (data.ack) {
        handshake += 1;
        if (handshake === 2) {
          return typeof callback === "function" ? callback() : void 0;
        }
      } else if (data.req) {
        return exposed_api.request(data.req, socket);
      } else {
        return remote_api.response(data != null ? data.res : void 0);
      }
    });
  });
};
