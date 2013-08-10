actLoaded('launcher', {
  
  initialize: function (acts) {
    this.name = 'launcher';
    this.acts = acts;
    
    this.$dom = $('.splash');
    
    broadcast({type: 'launch', activity: 'launcher', activities: this.acts});
  },

  onConnection: function (conn) {
    conn.send({type: 'launch', activity: 'launcher', activities: this.acts});
  },

  onData: function (conn, data) {
    if (data.cmd == 'launch' && this.acts.indexOf(data.activity) >= 0) {
      if (activity && 'terminate' in activity) activity.terminate();
      activity = null;
      
      getAct(data.activity, function (act) {
        activity = new act(data);
      });
    } else {
      console.log('weird launcher cmd', data);
    };
  },
  
});
