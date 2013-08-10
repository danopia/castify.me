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
      } else if (data.type === 'activity' && !activity && data.cmd == 'launch' && 'activity' in data) {
        if (data.activity in activities) {
          activity = new activities[data.activity]();
          activity.launch();
        };
      } else {
        console.log('Unhandled client packet:', data);
      };
    });
  });
});

var activities = {};


activities.stream = function () { this.initialize.apply(this, arguments); };
activities.stream.prototype.initialize = function () {
  this.name = 'stream';
  
  this.queue = [];
  
  this.$dom = $('<section class="act-stream">');
  this.$vid = $('<video autoload>');
  this.$header = $('<header>');
  this.$title = $('<h2>').appendTo(this.$header);
  this.$dom.append(this.$vid, this.$header);
};
activities.stream.prototype.launch = function () {
  broadcast({type: 'launch', activity: 'stream'});
  broadcast({type: 'activity', cmd: 'queue', items: this.queue});
  broadcast({type: 'activity', cmd: 'state'});
  $('body').append(this.$dom);
  $('section').hide();
  this.$dom.show();
};
activities.stream.prototype.onConnection = function (conn) {
  conn.send({type: 'launch', activity: 'stream'});
  conn.send({type: 'activity', cmd: 'queue', items: this.queue});
  conn.send({type: 'activity', cmd: 'state', item: this.current, playing: this.playing});
};
activities.stream.prototype.onData = function (conn, data) {
  if (data.cmd == 'queueAdd') {
    data.item.peer = conn.getPeer();
    this.queue.push(data.item);
    broadcast({type: 'activity', cmd: 'queueAdd', item: data.item});
    
    if (!this.current)
      this.playFromQueue();
  } else if (data.cmd == 'delta' && conn.getPeer() in this.conns) {
    var seat = this.conns[conn.getPeer()];
    this.dlt[seat] = data.delta;
  } else {
    console.log('weird pong cmd', data);
  };
};
activities.stream.prototype.playFromQueue = function () {
  this.current = this.queue.shift();
  broadcast({type: 'activity', cmd: 'queueShift'});
  
  this.$vid[0].src = this.current.src;
  broadcast({type: 'activity', cmd: 'state', item: this.current, playing: this.playing});
};

activities.pong = function () { this.initialize.apply(this, arguments); };
activities.pong.prototype.initialize = function () {
  this.name = 'pong';
  this.inLobby = true;
  this.running = false;
  
  this.conns = {};
  this.seats = [{label: 'red'}, {label: 'blue'}];
  this.score = ['waiting', 'waiting'];
  this.pos = [200, 200];
  this.dlt = [0, 0];
  this.ballPos = [200, 400];
  this.ballSpd = 600;
  
  var ang = 30 * (Math.PI * 2) / 360;
  this.ballDlt = [this.ballSpd * Math.cos(ang), this.ballSpd * Math.sin(ang)];
  
  this.$dom = $('<section class="act-pong">');
  this.$paddleL = $('<div class="pong-paddleL idk">');
  this.$paddleR = $('<div class="pong-paddleR idk">');
  this.$ball = $('<div class="pong-ball">');
  this.$scoreL = $('<div class="pong-scoreL">waiting</div>');
  this.$scoreR = $('<div class="pong-scoreR">waiting</div>');
  this.$divider = $('<div class="pong-divider">');
  this.$dom.append(this.$paddleL, this.$paddleR, this.$scoreL, this.$scoreR, this.$divider);
};
activities.pong.prototype.launch = function () {
  broadcast({type: 'launch', activity: 'pong'});
  broadcast({type: 'activity', cmd: 'lobby', seats: this.seats});
  $('body').append(this.$dom);
  $('section').hide();
  this.$dom.show();
  this.onStep(0);
};
activities.pong.prototype.onStep = function (timeDelta) {
  if (this.seats[0].peer) {
    this.pos[0] += this.dlt[0] * timeDelta;
    if (this.pos[0] < 100) this.pos[0] = 100;
    if (this.pos[0] > $('body').height() - 100) this.pos[0] = $('body').height() - 100;
    this.$paddleL.css('top', this.pos[0]);
  };
  
  if (this.seats[1].peer) {
    this.pos[1] += this.dlt[1] * timeDelta;
    if (this.pos[1] < 100) this.pos[1] = 100;
    if (this.pos[1] > $('body').height() - 100) this.pos[1] = $('body').height() - 100;
    this.$paddleR.css('top', this.pos[1]);
  };
  
  if (!this.running) return;
  
  this.ballDlt[0] *= 1.0001;
  this.ballDlt[1] *= 1.0001;
  
  this.ballPos[0] += this.ballDlt[0] * timeDelta;
  this.ballPos[1] += this.ballDlt[1] * timeDelta;
  
  if (this.ballPos[0] < 75) {
    if (!this.seats[0].peer) {
      this.ballDlt[0] *= -1;
      this.ballPos[0] += (2 * this.ballDlt[0] * timeDelta);
    } else if (this.pos[0] + 100 > this.ballPos[1] + 25 && this.pos[0] - 100 < this.ballPos[1] + 25) {
      this.ballDlt[0] *= -1;
      this.ballPos[0] += (2 * this.ballDlt[0] * timeDelta);
      
      this.ballSpd = Math.sqrt(Math.pow(this.ballDlt[0], 2) + Math.pow(this.ballDlt[1], 2));
      // var ang = Math.atan2(this.ballDlt[1], this.ballDlt[0]);
      var pos = ((this.ballPos[1] + 25) - (this.pos[0] - 100));
      var ang = (pos / 300 + (1/6)) * Math.PI - (Math.PI /2);
      console.log(pos, ang);
      
      this.ballDlt[0] = Math.cos(ang) * this.ballSpd;
      this.ballDlt[1] = Math.sin(ang) * this.ballSpd;
    } else {
      this.running = false;
    };
  };
  
  if (this.ballPos[0] > $('body').width() - 75 - 50) {
    if (!this.seats[1].peer) {
      this.ballDlt[0] *= -1;
      this.ballPos[0] += (2 * this.ballDlt[0] * timeDelta);
    } else if (this.pos[1] + 100 > this.ballPos[1] + 25 && this.pos[1] - 100 < this.ballPos[1] + 25) {
      this.ballDlt[0] *= -1;
      this.ballPos[0] += (2 * this.ballDlt[0] * timeDelta);
      
      this.ballSpd = Math.sqrt(Math.pow(this.ballDlt[0], 2) + Math.pow(this.ballDlt[1], 2));
      // var ang = Math.atan2(this.ballDlt[1], this.ballDlt[0]);
      var pos = ((this.ballPos[1] + 25) - (this.pos[1] - 100));
      var ang = (pos / 300 + (1/6)) * Math.PI - (Math.PI /2);
      console.log(pos, ang);
      
      this.ballDlt[0] = Math.cos(ang) * this.ballSpd * -1;
      this.ballDlt[1] = Math.sin(ang) * this.ballSpd;
    } else {
      this.running = false;
    };
  };
  
  if (this.ballPos[1] > $('body').height() - 50)       { this.ballDlt[1] *= -1; this.ballPos[1] += (2 * this.ballDlt[1] * timeDelta); }
  if (this.ballPos[1] < 0)              { this.ballDlt[1] *= -1; this.ballPos[1] += (2 * this.ballDlt[1] * timeDelta); }
  
  this.$ball.css({left: this.ballPos[0], top: this.ballPos[1]});
};
activities.pong.prototype.start = function () {
  if (this.running) return;
  
  this.inLobby = false;
  this.$dom.append(this.$ball);
  
  setTimeout(function () {
    this.running = true;
  }.bind(this), 5000);
};
activities.pong.prototype.invalidate = function () {
  this.$scoreL.text(this.score[0]);
  this.$scoreR.text(this.score[1]);
};
activities.pong.prototype.onConnection = function (conn) {
  conn.send({type: 'launch', activity: 'pong'});
  
  if (this.inLobby)
    conn.send({type: 'activity', cmd: 'lobby', seats: this.seats});
};
activities.pong.prototype.onData = function (conn, data) {
  if (data.cmd == 'join' && this.inLobby && !this.seats[data.seat].peer && !this.conns[conn.getPeer()]) {
    this.seats[data.seat].peer = conn.getPeer();
    this.conns[conn.getPeer()] = data.seat;
    this.score[data.seat] = 0;
    this.invalidate();
    
    if (data.seat)
      this.$paddleR.removeClass('idk');
    else
      this.$paddleL.removeClass('idk');
    
    broadcast({type: 'activity', cmd: 'lobby', seats: this.seats});
    conn.send({type: 'activity', cmd: 'join', seat: data.seat});
    
    //if (this.seats[0].peer && this.seats[1].peer)
      this.start();
  } else if (data.cmd == 'delta' && conn.getPeer() in this.conns) {
    var seat = this.conns[conn.getPeer()];
    this.dlt[seat] = data.delta;
  } else {
    console.log('weird pong cmd', data);
  };
};

