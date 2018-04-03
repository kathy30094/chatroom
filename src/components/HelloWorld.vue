<template>
  <div class="hello">
    <div id="container">

      <div id="status-box">
          Server: 
          <span id="status">{{status}}</span> / <span id="online">{{peopleOnline}}</span> online.
      </div>

      <h2>加入房間</h2>
      <div id='join room'>
        <label>roomA</label> <input type="checkbox" value="roomA" v-model="roomJoin">
        <label>roomB</label> <input type="checkbox" value="roomB" v-model="roomJoin">
        <label>roomC</label> <input type="checkbox" value="roomC" v-model="roomJoin">
        <br>
        <button type='button' @click="join">加入</button>
      </div>
      <br>
      <br>

      <h2>選擇聊天對象</h2>
      <div id='chose to-say'>
        <table>
          <tr>
            <td><label>all</label></td>
            <td><input type="radio" v-model="chatData.roomSelected" value='all' /></td>
          </tr>
          <tr>
            <td><label>roomA</label></td>
            <td><input type="radio" v-model="chatData.roomSelected" value='roomA' /></td>
          </tr>
          <tr>
            <td><label>roomB</label></td>
            <td><input type="radio" v-model="chatData.roomSelected" value='roomB' /></td>
          </tr>
          <tr>
            <td><label>roomC</label></td>
            <td><input type="radio" v-model="chatData.roomSelected" value='roomC' /></td>
          </tr>

          <tr v-for="memberAcc in memberList">
            <td>{{member}}</td>
            <td><input type="radio" v-model="chatData.roomSelected" value={{memberAcc}} /></td>
          </tr>
        </table>
      </div>
      <br>
      <br>

      <h2>開始聊天</h2>
      <div id="send-msg">
        <form id="send-form">
          <span id="name">{{chatData.name}} : </span>
          <input v-model="chatData.msg" type="text" name="msg" id="msg" placeholder="說點什麼？">
          <button type='button' @click="say">送出</button>
        </form>
      </div>
    </div>

     <!-- <ul>
        <li v-for="msg in msgs">
          {{msg}}
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
      memberlist: [],
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
      // console.log('aaaa');
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
          console.log(msg.data.name+" join in room "+msg.data.roomid);
          break;
        case 'say':
          console.log(msg.data.name+' : '+msg.data.msg+" ----->to " + msg.data.roomid);
          break;
      };
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
