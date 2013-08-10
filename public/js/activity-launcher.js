actLoaded('launcher', {
  
  initialize: function (data) {
    this.$dom = $('<section>');
    var $h1 = $('<h1>', {text: 'launch an activity'});
    var $ul = $('<ul>', {id: 'activity-list'});
    this.$dom.append($h1, $ul);
    
    for (var i in data.activities) {
      var $li = $('<li><button class="tall"><div></div><span></span></button></li>');
      $li.find('button').data('activity', data.activities[i]);
      $li.find('span').text(data.activities[i]);
      $ul.append($li);
    };
    
    $ul.on('click', 'button', this.onClick);
  },

  launch: function () {
    $('#sects').append(this.$dom);
    this.$dom.css({left: '100%', right: '-100%'}).show().animate({left: 0, right: 0});
  },

  close: function () {
    this.$dom.animate({left: '-125%', right: '125%'}, function () {
      this.$dom.detach();
    }.bind(this));
  },

  onClick: function (e) {
    var act = $(e.currentTarget).data('activity');
    tvconn.send({type: 'activity', cmd: 'launch', activity: act});
  },
  
});
