actLoaded('pong', {

  initialize: function () {
    this.lobby = new Lobby('pong');
    this.lobby.onPick = this.pickSeat.bind(this);
    
    this.$dom = $('<section>');
    var $h1 = $('<h1>', {text: 'play pong'});
    var $ul = $('<ul>');
    $ul.append($('<li><button data-key="w"><span>up (w)</span></button></li>'));
    $ul.append($('<li><button data-key="s"><span>down (s)</span></button></li>'));
    
    this.$dom.append($h1, $ul);
  },

  open: function () {
    if (this.$dom.is(":visible")) return;
    
    $('#sects').append(this.$dom);
    this.$dom.css({left: '100%', right: '-100%'}).show().animate({left: 0, right: 0});
    
    $('body').keydown(function (e) {
      if (e.keyCode == 87) {
        $('[data-key=w]').addClass('pressed');
        tvconn.send({type: 'activity', cmd: 'delta', delta: -1000});
      } else if (e.keyCode == 83) {
        $('[data-key=s]').addClass('pressed');
        tvconn.send({type: 'activity', cmd: 'delta', delta: 1000});
      };
    });
    
    $('body').keyup(function (e) {
      if (e.keyCode == 87) {
        $('[data-key=w]').removeClass('pressed');
        tvconn.send({type: 'activity', cmd: 'delta', delta: 0});
      } else if (e.keyCode == 83) {
        $('[data-key=s]').removeClass('pressed');
        tvconn.send({type: 'activity', cmd: 'delta', delta: 0});
      }
    });
  },

  close: function () {
    if (!this.$dom.is(":visible")) return;
    
    this.$dom.animate({left: '-125%', right: '125%'}, function () {
      this.$dom.detach();
    }.bind(this));
    
    $('body').off('keydown').off('keyup');
  },

  onData: function (data) {
    if (data.cmd == 'lobby') {
      this.close();
      this.lobby.setSeats(data.seats);
      this.lobby.show();
    } else if (data.cmd == 'join') {
      this.lobby.hide();
      this.seat = data.seat;
      this.open();
    } else {
      console.log('weird pong packet from tv', data);
    };
  },

  pickSeat: function (seat) {
    tvconn.send({type: 'activity', cmd: 'join', seat: seat});
  },

});
