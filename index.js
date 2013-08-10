
// PeerJS
///////////

var PeerServer = require('peer').PeerServer;
PeerServer.prototype._generateClientId = function(key) {
  var clientId = Math.random().toString(36).slice(2, 10);
  if (!this._clients[key]) {
    return clientId;
  }
  while (!!this._clients[key][clientId]) {
    clientId = util.randomId();
  }
  return clientId;
};
var peerServer = new PeerServer({port: 9000, debug: true});

// Express
////////////

var express = require('express'),
    app = express(),
    server = require('http').createServer(app);
//    io = require('socket.io').listen(server);

server.listen(80);

app.use(function(req, res, next){
  console.log(req.method, req.url);
  next();
});

app.use(express.static(__dirname + '/public'));

