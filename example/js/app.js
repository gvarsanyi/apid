var apid   = require('../../js/apid'),
    client = apid.client('my-daemon-name-id');

// expose API on the client. This can be called from the daemon.
client.expose('version', function (cb) {
  cb(null, '1.0.0');
});

client.connect(__dirname + '/daemon-entry.js', function (err) {
  // ready and connected to apid server. Call a remote method:
  client.remote.math.sum(1, 3, function (err, sum, caller_version) {
    console.log('This should be 4:', sum);
    console.log('Caller version returned:', caller_version);
    if (sum !== 4) {
      process.exit(1);
    }
    process.exit(0);
  });
});
