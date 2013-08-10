var Stream = function () { this.initialize.apply(this, arguments); };

Stream.prototype.initialize = function () {
  this.name = 'stream';
  
  this.queue = [];
  
  this.$dom = $('<section class="act-stream">');
  this.$vid = $('<video autoload>');
  this.$header = $('<header>');
  this.$title = $('<h2>').appendTo(this.$header);
  this.$dom.append(this.$vid, this.$header);

};
Stream.prototype.launch = function () {
  broadcast({type: 'launch', activity: 'stream'});
  broadcast({type: 'activity', cmd: 'queue', items: this.queue});
  broadcast({type: 'activity', cmd: 'state'});
  $('body').append(this.$dom);
  $('section').hide();
  this.$dom.show();
};

Stream.prototype.onConnection = function (conn) {
  conn.send({type: 'launch', activity: 'stream'});
  conn.send({type: 'activity', cmd: 'queue', items: this.queue});
  conn.send({type: 'activity', cmd: 'state', item: this.current, playing: this.playing});
};

Stream.prototype.onData = function (conn, data) {
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

Stream.prototype.playFromQueue = function () {
  this.current = this.queue.shift();
  broadcast({type: 'activity', cmd: 'queueShift'});
  
  this.$vid[0].src = this.current.src;
  broadcast({type: 'activity', cmd: 'state', item: this.current, playing: this.playing});
};

actLoaded('stream', Stream);

