APID
====

Connect to (and, if needed, fire up) a daemon with exposed asynchronous API and
share or cache data across clients.


# Wut?
APID fits your needs if you want to split your node.js code to
- a daemon that is fired up by the client, and
- a client

# What's the workflow?
## Install `apid`
    npm isntall apid --save
## Create your daemon: daemon-entry.js
    var apid = require('apid');

    // example API
    var math = {
      sum: function(a, b, callback) {
        callback.remote.version(function (err, caller_version) {
          callback(null, a + b, '*' + caller_version + '*');
        });
      }
    }

    // expose API before starting the service
    apid.expose({math: math});

    apid.server('my-daemon-name-id', function (err) {
      // ready and listening. Outputs are redirected to files in:
      // ~/.config/my-daemon-name-id/apid-$UID.[err|out]
      console.log('started');
    });

## Create your client: app.js
    var apid = require('apid');

    // expose API on the client. This can be called from the daemon.
    apid.expose('version', function (callback) {
      callback(null, '1.0.0');
    });

    // connect (and fire up daemon if not running yet)
    apid('my-daemon-name-id', __dirname + '/daemon-entry.js', function (err) {
      // ready and connected to apid. Call a remote method:
      apid.remote.math.sum(1, 3, function (err, sum, caller_version) {
        console.log('This should be 4:', sum);
        console.log('Caller version returned:', caller_version);
      });
    });


# API of APID
## apid(daemon_name_id, daemon_entry_absolute_path, ready_callback_function)
Connects to APID as a client, fires up the daemon if not running yet

## apid.server(daemon_name_id, ready_callback_function)
Fires up daemon

## apid.expose(key[, subkey[, subsubkey, ...]], function_reference) or apid.expose({key: {subkey: function_reference}})
Exposes a function (or functions on an object) to make them available for connecting peers on the .remote object
Asynchronous alert:
- all exposed functions must take a callback function as their last argument
- all callbacks should be called back with signiture: `callback(err[, arg1[, arg2, ...]]);` where err is an Error type or `null` or `undefined` if there was no error.

## apid.session object (sharing data with remote)
Add keys and values to apid.session you want to share. Be careful not to add too much, this will be distributed in connection time.
Note:
- Server session data is available for clients on apid.remoteSession after connection
- Caller client session data is available for server API methods on the callback function (as callback.session) much like client API (on callback.remote)
- Changes after connection will not be exposed.
- JSON restrictions apply (see "Caveats" below)

## apid.remote object (container of daemon API for clients)

## callback.remote object (container of client's expose API for daemon)
You may call methods on your caller client from the daemon using .remote exposed on the callback function.
See example daemon-entry.js above.

## callback.log(args...[, callback]) and callback.errorLog(args...[, callback]) functions
These methods will trigger client's console.log() and console.error() respectively.
Note: the callback argument is optional. If not used, order of execution can not guaranteed, but generally events stay in order.

# Manual interaction with the daemon via the client (on terminal)
## Start
    node my-client.js --daemon-start
## Stop
    node my-client.js --daemon-stop
## Kill
    node my-client.js --daemon-kill
## Restart
    node my-client.js --daemon-restart
## Reload
    node my-client.js --daemon-reload
## Status
    node my-client.js --daemon-status


# Caveats
- Inter-service communication is in JSON. References will be turned into copies, functions will be omitted and Object types will be lost.
- You will need to stop+start (or restart) your daemon manually while developing or when changing versions.
