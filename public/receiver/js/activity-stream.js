actLoaded('stream', {

  initialize: function () {
    this.name = 'stream';
    
    this.queue = [];
    
    this.$dom = $('<section class="act-stream">');
    this.$vid = $('<video autoload>');
    this.$header = $('<header>');
    this.$title = $('<h2>').appendTo(this.$header);
    this.$dom.append(this.$vid, this.$header);
  },
  
  launch: function () {
    broadcast({type: 'launch', activity: 'stream'});
    broadcast({type: 'activity', cmd: 'queue', items: this.queue});
    broadcast({type: 'activity', cmd: 'state'});
    $('body').append(this.$dom);
    $('section').hide();
    this.$dom.show();
  },

  onConnection: function (conn) {
    conn.send({type: 'launch', activity: 'stream'});
    conn.send({type: 'activity', cmd: 'queue', items: this.queue});
    conn.send({type: 'activity', cmd: 'state', item: this.current, playing: this.playing});
  },

  onData: function (conn, data) {
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
  },

  playFromQueue: function () {
    this.current = this.queue.shift();
    broadcast({type: 'activity', cmd: 'queueShift'});
    
    this.$vid[0].src = this.current.src;
    broadcast({type: 'activity', cmd: 'state', item: this.current, playing: this.playing});
  },

});
