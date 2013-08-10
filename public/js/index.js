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
    showHome(true);
    
    $('#tv').show();
    $('#tvid').text(tvconn.peer);
  });
  
  if ($('#connect').css('left') == '0px') {
    $('#connect').animate({left: '-125%', right: '125%'});
    $('#loading').text('connecting...');
  };
};

function onTvData (data) {
  console.log('TV', '>>>', data);
  if (data.type == 'launch') {
    if (data.activity == 'pong') {
      startPong();
    } else if (data.activity == 'stream') {
      $('#act-stream').css({left: '100%', right: '-100%'}).show().animate({left: 0, right: 0});
    } else {
      console.log('Launching unknown activity', data.activity);
    };
  } else if (data.type == 'banner') {
    $('#tvname').text(data.name || 'castify TV');
  } else if (data.cmd == 'state' && data.item) {
    $('#act-stream video')[0].src = data.item.src;
  } else if (data.type == 'pong' && data.ts) {
    console.log('Ping:', new Date() - data.ts + 'ms');
  } else {
    console.log('Unhandled TV packet:', data);
  };
};

function showHome (firstTime) {
  $('#home').css({left: '100%', right: '-100%'}).show().animate({left: 0, right: 0});
};

function startPong () {
  if ($('#home').css('left') == '0px') {
    $('#home').animate({left: '-125%', right: '125%'});
    $('#loading').text('waiting...');
  };
  
  $('#act-pong-lobby').css({left: '100%', right: '-100%'}).show().animate({left: 0, right: 0});
  
  $('#act-pong-lobby [data-idx=0]').click(function (e) {
    tvconn.send({type: 'activity', cmd: 'join', player: 0});
    playPong();
  });
  $('#act-pong-lobby [data-idx=1]').click(function (e) {
    tvconn.send({type: 'activity', cmd: 'join', player: 1});
    playPong();
  });
}

function playPong () {
  $('#act-pong-lobby').animate({left: '-125%', right: '125%'});
  $('#act-pong-game').css({left: '100%', right: '-100%'}).show().animate({left: 0, right: 0});
  
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
};

$(function () {
  $('#activity-list').on('click', 'button', function (e) {
    e.preventDefault();
    var activity = $(e.currentTarget).data('activity');
    tvconn.send({type: 'launch', activity: activity});
    
    $('#home').animate({left: '-125%', right: '125%'});
    $('#loading').text('waiting...');
  });
  
  $('#stream-form').submit(function (e) {
    e.preventDefault();
    var src = $('#stream-form input').val();
    if (!src) return false;
    $('#stream-form input').val('');
    tvconn.send({type: 'activity', cmd: 'queueAdd', item: {src: src}});
  });
});

/*
$killSwitch.on('click', function() {
  cast_api.stopActivity(cv_activity.activityId, function(){
    cv_activity = null;
  
    $killSwitch.prop('disabled', true);
  });
});
*/
