// Cast SDK stuff
///////////////////

(function () {
  var cast_api, cv_activity, receiverList;

  window.addEventListener('message', function(event) {
    if (event.source === window && event.data && event.data.source === 'CastApi' && event.data.event === 'Hello' && !cast_api) {
      cast_api = new cast.Api();
      cast_api.addReceiverListener('f2889f47-f852-45c0-bed0-010cbf577c0b', onReceiverList);
    };
  });

  onReceiverList = function(list) {
    receiverList = list;
    $('#receiver-list').empty();
    list.forEach(function(receiver) {
      $listItem = $('<li><a href="#" data-id="' + receiver.id + '">' + receiver.name + '</a></li>');
      $listItem.on('click', receiverClicked);
      $('#receiver-list').append($listItem);
    });
  };

  receiverClicked = function(e) {
    e.preventDefault();

    var $target = $(e.target);
    for (id in receiverList) {
      if (receiverList[id].id === $target.data('id'))
        doLaunch(receiverList[id]);
    };
  };

  var mReceiver;
  doLaunch = function(receiver) {
    mReceiver = receiver;
    var request = new cast.LaunchRequest('f2889f47-f852-45c0-bed0-010cbf577c0b', receiver);
    cast_api.launch(request, onLaunch);
    $('#connect').animate({left: '-125%', right: '125%'});
    $('#loading').text('launching...');
  };
  
  onLaunch = function(activity) {
    if (activity.status === 'running') {
      cv_activity = activity;
      cast_api.sendMessage(cv_activity.activityId, 'castify', {name: mReceiver.name});
      cast_api.addMessageListener(cv_activity.activityId, 'castify', function (msg) {
        if (msg && 'id' in msg)
          connectToTv(msg.id);
      });
    };
  };
})();

// TV Connection
//////////////////

$('#tvid-form').submit(function (e) {
  e.preventDefault();
  connectToTv($('#tvid-form input').val());
});
$(function () {
  $('#tvid-form input').focus();
});

var tvconn, peer = new Peer({host: 'cast.danopia.net', port: 9000});

function connectToTv (id) {
  if (tvconn) return false;
  
  tvconn = peer.connect(id);
  tvconn.on('data', onTvData);
  tvconn.on('open', function () {
    setInterval(function () {
      tvconn.send({type: 'ping', ts: +new Date()});
    }, 10000);
    
    $('#tv').show();
    $('#tvid').text(tvconn.peer);
  });
  
  if ($('#connect').css('left') == '0px') {
    $('#connect').animate({left: '-125%', right: '125%'});
    $('#loading').text('connecting...');
  };
};

var activity;
function onTvData (data) {
  console.log('TV', '>>>', data);
  if (data.type == 'launch') {
    if (activity) activity.close();
    activity = null;
    
    getAct(data.activity, function (act) {
      activity = new act(data);
      activity.launch();
    });
  } else if (data.type == 'activity' && activity && 'onData' in activity) {
    activity.onData(data);
  } else if (data.type == 'banner') {
    $('#tvname').text(data.name || 'castify TV');
  } else if (data.type == 'pong' && data.ts) {
    console.log('Ping:', new Date() - data.ts + 'ms');
  } else {
    console.log('Unhandled TV packet:', data);
  };
};

$(function () {
  $('#stream-form').submit(function (e) {
    e.preventDefault();
    var src = $('#stream-form input').val();
    if (!src) return false;
    $('#stream-form input').val('');
    tvconn.send({type: 'activity', cmd: 'queueAdd', item: {src: src}});
  });
});

// Activity Loading
/////////////////////

var activities = {}, cbs = {};
function actLoaded (act, prototype) {
  activities[act] = new Function('this.initialize.apply(this, arguments);');
  activities[act].prototype = prototype;
  
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

// Lobby
//////////

var Lobby = window.Lobby = function (activity, seats) {
  this.$dom = $('<section>');
  this.$h1 = $('<h1>', {text: activity + ' lobby'});
  this.$ul = $('<ul>');
  this.$dom.append(this.$h1, this.$ul);
  
  this.setSeats(seats || []);
  this.$ul.on('click', 'button', this.onClick.bind(this));
};

Lobby.prototype.setSeats = function (seats) {
  this.seats = seats;
  this.$ul.empty();
  
  for (var key in seats) {
    var $li = $('<li><button><span></span></button></li>');
    $li.find('button').data('seat', key);
    $li.find('span').text('play ' + seats[key].label);
    
    if (seats[key].peer)
      $li.find('button').addClass('disabled');
    
    this.$ul.append($li);
  };
};

Lobby.prototype.onClick = function (e) {
  e.preventDefault();
  
  var $btn = $(e.currentTarget);
  var seat = +$btn.data('seat');
  
  if (!this.seats[seat].peer)
    this.onPick(seat);
};

Lobby.prototype.show = function () {
  if (this.$dom.is(":visible")) return;
  
  $('#sects').append(this.$dom);
  this.$dom.css({left: '100%', right: '-100%'}).show().animate({left: 0, right: 0});
};

Lobby.prototype.hide = function () {
  this.$dom.animate({left: '-125%', right: '125%'}, function () {
    this.$dom.detach();
  }.bind(this));
};

/* cast_api.stopActivity(cv_activity.activityId, function(){
     cv_activity = null;;
   }); */

