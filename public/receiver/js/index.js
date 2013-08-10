// Cast SDK junk
var receiver, channelHandler, name;
(function () {
  receiver = new cast.receiver.Receiver('f2889f47-f852-45c0-bed0-010cbf577c0b', [cast.receiver.RemoteMedia.NAMESPACE, 'castify'], '', 5);
  channelHandler = new cast.receiver.ChannelHandler('castify');
  //var remoteMedia = new cast.receiver.RemoteMedia();
  channelHandler.addChannelFactory(receiver.createChannelFactory('castify'));
  receiver.start();

  channelHandler.addEventListener(cast.receiver.Channel.EventType.MESSAGE, function (event) {
    if ('name' in event.message) {
      name = event.message.name;
      $('.tvname span').text(name);
      $('.tvname').show().animate({opacity: 1});
      broadcast({type: 'banner', name: name});
    } else
      console.log('Unhandled message:', event.message);
  });
  
  channelHandler.addEventListener(cast.receiver.Channel.EventType.OPEN, function (event) {
    event.target.send({id: peer.id});
  });
})();

var acts = 'stream pong tetris scrabble webcam clock weather finance present beam cards books'.split(' ');

var peer;
$(function () {
  peer = new Peer({host: 'cast.danopia.net', port: 9000});

  peer.on('open', function () {
    $('.tvid span').text(peer.id);
    $('.tvid').show().animate({opacity: 0.75}).css('margin-left', -($('.tvid').width() + 40)/2);
    
    channelHandler.getChannels().forEach(function (channel) {
      channel.send({id: peer.id});
    });
  });
});

function broadcast (pkt) {
  for (var key in peer.connections)
    peer.connections[key].peerjs.send(pkt);
};

var activity;

var lastStep = new Date();
setInterval(function () {
  var now = new Date(), delta = now - lastStep;
  lastStep = now;
  
  if (activity && 'onStep' in activity)
    activity.onStep(delta / 1000);
}, 1/120);

$(function () {
  peer.on('connection', function(conn) {
    conn.on('open', function () {
      conn.send({type: 'banner', name: name});
      
      if (activity) {
        if ('onConnection' in activity)
          activity.onConnection(conn);
        else
          conn.send({type: 'launch', activity: activity.name});
      } else {
        conn.send({type: 'launch', activity: 'launcher', activities: acts});
      };
    });
    
    conn.on('data', function (data) {
      if (data.type === 'ping') {
        conn.send({type: 'pong', ts: data.ts});
      } else if (data.type === 'activity' && activity && 'onData' in activity) {
        activity.onData(conn, data);
      } else if (data.type === 'activity' && !activity && data.cmd == 'launch' && 'activity' in data && acts.indexOf(data.activity) >= 0) {
        if (activity && 'terminate' in activity) activity.terminate();
        activity = null;
        
        getAct(data.activity, function (act) {
          activity = new act(data);
          activity.launch();
        });
      } else {
        console.log('Unhandled client packet:', data);
      };
    });
  });
});

// Activity Loading
/////////////////////

window.activities = {};
var cbs = {};
function actLoaded (act, constr) {
  activities[act] = constr;
  
  if (act in cbs) {
    cbs[act](activities[act]);
    delete cbs[act];
  };
};
function getAct (act, cb) {
  if (act in activities) {
    cb(activities[act]);
  } else {
    cbs[act] = cb;
    var $script = $('<script async>').attr('src', 'js/activity-' + act + '.js');
    $('[data-script]').after($script);
  };
};

