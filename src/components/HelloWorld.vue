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
            <td><input type="radio" v-model="chatData.chatSelect" value='all' name="chose"/></td>
          </tr>
          <tr>
            <td><label>roomA</label></td>
            <td><input type="radio" v-model="chatData.chatSelect" value='roomA' name="chose"/></td>
          </tr>
          <tr>
            <td><label>roomB</label></td>
            <td><input type="radio" v-model="chatData.chatSelect" value='roomB' name="chose"/></td>
          </tr>
          <tr>
            <td><label>roomC</label></td>
            <td><input type="radio" v-model="chatData.chatSelect" value='roomC' name="chose"/></td>
          </tr>

          <tr v-for="(memberAcc) in memberlist">
            <td>{{memberAcc}}</td>
            <td><input type="radio" v-model="chatData.chatSelect" :value='memberAcc' name="chose"/></td>
          </tr>
        </table>
      </div>
      <br>
      <br>

      <h2>開始聊天</h2>
      <div id="send-msg">
        <form id="send-form">
          <!-- <span id="Acc">{{sessionStorage.Account}} : </span> -->
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
        msg: '',
        chatSelect: 'all',
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
        chatSelect: this.chatData.chatSelect,
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
      this.$socket.emit('isOnline',sessionStorage.token);
      // console.log('aaaa');
    },

    disconnect(){
      this.status = 'disConnceted';
    },
    
    memberAcc(memberAcc)
    {
      sessionStorage.setItem('Account',memberAcc);
    },

    message(msg)
    {
      switch(msg.event){
        case 'join':
          console.log(msg.data.Acc+" join in room "+msg.data.roomid);
          break;
        case 'say':
          console.log(msg.data.Acc+' : '+msg.data.msg+" ----->to " + msg.data.chatSelect);
          break;
      };
    },
    showAllMember(memberOnlineArray)
    {
      this.memberlist = memberOnlineArray;
      console.log(memberOnlineArray);
    },
  },

  mounted() {
    sessionStorage.setItem('token',window.name);
    // this.isOnline();
  }
}

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
