<template>
  <div class="hello">
    <div id="container">
      <div id="status-box">
          Server: 
          <span id="status">{{status}}</span> / <span id="online">{{peopleOnline}}</span> online.
      </div>
      <!-- <ul>
        <li v-for="msg in msgs">
          {{msg}}
        </li>
      </ul> -->
      
      <div id="send-box">
        
        <form id="send-form">
          <span id="name">{{chatData.name}} : </span>
          <!-- <input type="text" name="name" id="name" placeholder="暱稱" value=> -->
          <input v-model="chatData.msg" type="text" name="msg" id="msg" placeholder="說點什麼？">
          <button type='button' @click="say">送出</button>
        </form>
      </div>
      <div>
        <form id="room-form"> 
        <input type="radio" v-model="chatData.roomSelected" value='all' @change="show"/><label>all</label>
        <br>
        <input type="radio" v-model="chatData.roomSelected" value='roomA' @change="show"/> <label>roomA</label> <input type="checkbox" value="roomA" v-model="roomJoin">
        <br>
        <input type="radio" v-model="chatData.roomSelected" value='roomB' @change="show"/> <label>roomB</label> <input type="checkbox" value="roomB" v-model="roomJoin">
        <br>
        <input type="radio" v-model="chatData.roomSelected" value='roomC' @change="show"/> <label>roomC</label> <input type="checkbox" value="roomC" v-model="roomJoin">
        <button type='button' @click="join">加入群組</button>
        <!-- <input v-modole="chatData.roomid" type="text" name="roomid" id="roomid" placeholder="member talk to..."> -->
      </div>
    </div>
    <!-- <h1>{{ msg }}</h1>
    <h2>Essential Links</h2>
    <ul>
      <li>
        
      </li>
    </ul> -->
  </div>
</template>

<script>
export default {
  data(){
    return{
      chatData: {
        // name: '',
        msg: '',
        roomSelected: 'all',
      },
      roomJoin: [],
      peopleOnline: '',
      status: '',
      msgs: [],
    };
  },
  methods: {
  
    isOnline(){
      this.$socket.emit('isOnline',sessionStorage.token);
    },

    say(){
      let chatData = {
        msg: this.chatData.msg,
        token: sessionStorage.token,
        roomid: this.chatData.roomSelected,
      };
      this.$socket.emit('say', chatData);
    },

    join(){
      let joinData = {
        token: sessionStorage.token,
        roomids: this.roomJoin,
      };
      this.$socket.emit('join', joinData);
      console.log('joined');
    },
  },

  sockets: {
    connect(){
      this.status = 'Connceted';
      console.log('aaaa');
    },

    disconnect(){
      this.status = 'disConnceted';
    },
    
    memberName(memberAcc)
    {
      sessionStorage.setItem('name',memberAcc);
      this.chatData.name = memberAcc;
      
      //console.log(memberAcc);
    },

    message(msg)
    {
      switch(msg.event){
        case 'join':
          console.log('event join');
          console.log(msg.data.name);
          console.log(msg.data.name+" join in room "+msg.data.roomid);
          break;
        case 'say':
          console.log(msg.data.name+' : '+msg.data.msg+" ----->to " + msg.data.roomid);
          break;
      };

      // if(msg.data.username!==sessionStorage.userAcc) {
      //   console.log(msg.data.username + '说: ' + msg.data.text);
      //   showMessage(msg.data);
      // }
    },
  },

  mounted() {
    sessionStorage.setItem('token',window.name);
    this.isOnline();
    //this.join();
  }
}
// socket.on("msg", function (d) {
  //     var msgBox = document.createElement("div")
  //         msgBox.className = "msg";
  //     var nameBox = document.createElement("span");
  //         nameBox.className = "name";
  //     var name = document.createTextNode(d.name);
  //     var msg = document.createTextNode(d.msg);
  //     nameBox.appendChild(name);
  //     msgBox.appendChild(nameBox);
  //     msgBox.appendChild(msg);
  //     content.appendChild(msgBox);
// });
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
