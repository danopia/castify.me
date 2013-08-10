var app = require('http').createServer(handler)
  , fs = require('fs')

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

app.listen(80);

function handler (req, res) {
  console.log(req.method, req.url);
  
  fs.readFile(__dirname + '/' + (req.url == '/receiver' ? 'receiver' : 'index') + '.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading html file');
    }

    res.writeHead(200);
    res.end(data);
  });
}

