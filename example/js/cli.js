var apid   = require('../../js/apid'),
    client = apid.client('apid-example');

// expose API on the client. This can be called from the daemon.
client.expose('version', function (cb) {
  cb(null, '1.0.0');
});

client.connect(__dirname + '/daemon.js', function (err) {
  // ready and connected to apid server. Call a remote method:
  client.remote.math.sum(1, 3, function (err, sum, caller_version) {
    if (sum !== 4) {
      console.error('Error #1');
      process.exit(1);
    }
    if (caller_version !== '*1.0.0*') {
      console.error('Error #2');
      process.exit(caller_version);
    }
    console.log('test #1 DONE');
    process.exit(0);
  });
});
