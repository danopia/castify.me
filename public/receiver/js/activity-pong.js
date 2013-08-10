var Pong = function () { this.initialize.apply(this, arguments); };

Pong.prototype.initialize = function () {
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

Pong.prototype.launch = function () {
  broadcast({type: 'launch', activity: 'pong'});
  broadcast({type: 'activity', cmd: 'lobby', seats: this.seats});
  $('body').append(this.$dom);
  $('section').hide();
  this.$dom.show();
  this.onStep(0);
};

Pong.prototype.onStep = function (timeDelta) {
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
      
      broadcast({type: 'activity', cmd: 'lobby', seats: this.seats});
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
      
      broadcast({type: 'activity', cmd: 'lobby', seats: this.seats});
    };
  };
  
  if (this.ballPos[1] > $('body').height() - 50)       { this.ballDlt[1] *= -1; this.ballPos[1] += (2 * this.ballDlt[1] * timeDelta); }
  if (this.ballPos[1] < 0)              { this.ballDlt[1] *= -1; this.ballPos[1] += (2 * this.ballDlt[1] * timeDelta); }
  
  this.$ball.css({left: this.ballPos[0], top: this.ballPos[1]});
};

Pong.prototype.start = function () {
  if (this.running) return;
  
  this.inLobby = false;
  this.$dom.append(this.$ball);
  
  setTimeout(function () {
    this.running = true;
  }.bind(this), 5000);
};

Pong.prototype.invalidate = function () {
  this.$scoreL.text(this.score[0]);
  this.$scoreR.text(this.score[1]);
};

Pong.prototype.onConnection = function (conn) {
  conn.send({type: 'launch', activity: 'pong'});
  conn.send({type: 'activity', cmd: 'lobby', seats: this.seats});
};

Pong.prototype.onData = function (conn, data) {
  if (data.cmd == 'join' && !this.seats[data.seat].peer && !this.conns[conn.getPeer()]) {
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

actLoaded('pong', Pong);
