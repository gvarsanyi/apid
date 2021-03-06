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
    var apid   = require('apid'), // apid library
        server = apid.server;     // apid.server instance

    // example API
    var math = {
      sum: function(a, b, callback) {
        callback.remote.version(function (err, caller_version) {
          callback(null, a + b, '*' + caller_version + '*');
        });
      }
    }

    // expose API before starting the service
    server.expose({math: math});

    // starting server 'my-daemon-name-id'
    server.start('my-daemon-name-id', function (err) {
      // ready and listening. Outputs are redirected to files in:
      // ~/.config/my-daemon-name-id/apid-$UID.[err|out]
      console.log('started');
    });

## Create your client: app.js
    var apid   = require('apid'), // apid library
        client = apid.client('my-daemon-name-id'); // apid client instance

    // expose API on the client. This can be called from the daemon.
    client.expose('version', function (callback) {
      callback(null, '1.0.0');
    });

    // connect (and fire up daemon if not running yet)
    client.connect(__dirname + '/daemon-entry.js', function (err) {
      // ready and connected to apid server. Call a remote method:
      client.remote.math.sum(1, 3, function (err, sum, caller_version) {
        console.log('This should be 4:', sum);
        console.log('Caller version returned:', caller_version);
      });
    });


# API of APID
## client = apid.client(daemon_name)
Returns newly created or existing named client

## client.connect(daemon_entry_absolute_path[, options][, ready_callback_function])
Connects to APID daemon as a client, fires up the daemon if not running yet

Useful options:
- *cwd*: set a current working directory for the daemon (if not running yet)
- *coffeePath*: if you want to fire up a coffee-script daemon you may have to
  specify a coffee-script library path to require
- *stdout* and *stderr*: broadcast daemon's STDOUT and/or STDERR outputs to client's console
- *timeout*: (in seconds) max wait time for socket creation. Big projects with a
  lot of syncronous boot tasks (like a ton of modules to require) may take a
  while to fire up. Default is 5 seconds, but it can be set between 0..30 seconds.

## apid.server
Server instance. Utilize it for creating daemons.

## apid.server.start(daemon_name[, options][, ready_callback_function])
Fires up daemon

## apid.server.onConnect(fn)
Subscribes for "client is connected" event. This happens:
    - every time a client is connected and has fully exposed its features to the server, and
    - right before the server sends acknowledge message to client
Callback function has exactly one argument: a metafunction that has exactly the same interface as regular callbacks (cb.remote, cb.session) but will do nothing when called itself as cb()

## .expose(key[, subkey[, subsubkey, ...]], function_reference) or apid.expose({key: {subkey: function_reference}})
Exposes a function (or functions on an object) to make them available for connecting peers on the .remote object
Asynchronous alert:
- all exposed functions may take a callback function as their last argument
- all callbacks should be called back with signiture: `callback(err[, arg1[, arg2, ...]]);` where err is an Error type or `null` or `undefined` if there was no error.
Note: available on both client and apid.server instances.

## .session object (sharing data with remote)
Add keys and values to apid.session you want to share. Be careful not to add too much, this will be distributed in connection time.
Note:
- Server session data is available for clients on apid.remoteSession after connection
- Caller client session data is available for server API methods on the callback function (as callback.session) much like client API (on callback.remote)
- Changes after connection will not be exposed.
- JSON restrictions apply (see "Caveats" below)
- Available on both client and apid.server instances.

## client.remote and callback.remote objects
Container of exposed API on remote peer.
See example daemon-entry.js above.

## client.status(callback)
Returns daemon status in a callback. Callback signiture is: `(err, pid)` where `err` will be null or an Error object (if daemon is not running) and `pid` will be null or process ID of the daemon

## Automatically exposed on callback.remote
### callback.remote.ping(callback)
Ping remote
### callback.remote.console.log(args...[, callback])
Trigger remote's console.log() on client
### callback.remote.console.error(args...[, callback])
Trigger remote's console.error() on client

# Manual interaction with the daemon via the client (on terminal)
## Start
    node my-client.js --daemon-start
This will exit after daemon is started. E.g. your code will run until the client connects.
## Stop
    node my-client.js --daemon-stop
This will exit after daemon is started. E.g. your code will run until the client connects.
## Kill
    node my-client.js --daemon-kill
This will exit after daemon is started. E.g. your code will run until the client connects.
## Restart
    node my-client.js --daemon-restart
This will NOT exit after (re)starting daemon. E.g. your code will continue running after the status was output.
## Reload
    node my-client.js --daemon-reload
This will NOT exit after (re)loading daemon. E.g. your code will continue running after the status was output.
## Status
    node my-client.js --daemon-status
This will exit after daemon is started. E.g. your code will run until the client connects.
## Pick up STDOUT and/or STDERR of daemon
    node my-client.js --daemon-stdout --daemon-stderr


# Caveats
- Inter-service communication is in JSON. References will be turned into copies, functions will be omitted and Object types will be lost.
- You will need to stop+start (or restart) your daemon manually while developing or when changing versions.
