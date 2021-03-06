var Apid, Client, Server, clients;

Client = require('./lib/client');

Server = require('./lib/server');

clients = {};

Apid = (function() {
  function Apid() {}

  Apid.client = function(name) {
    if (clients[name] == null) {
      clients[name] = new Client(name);
    }
    return clients[name];
  };

  Apid.server = new Server;

  return Apid;

})();

module.exports = Apid;
