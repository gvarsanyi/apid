var apid   = require('../../js/apid'),
    server = apid.server;

// example API
var math = {
  sum: function(a, b, cb) {
    cb.remote.version(function (err, caller_version) {
      cb(null, a + b, '*' + caller_version + '*');
    });
  }
}

// expose API before starting the service
server.expose({math: math});

server.start('apid-example', function (err) {
  // ready and listening. Outputs are redirected to files in:
  // ~/.config/my-daemon-name-id/apid-$UID.[err|out]
  console.log('started');
});
