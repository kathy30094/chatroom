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
            <input type="text" name="msg" id="msg" placeholder="說點什麼？">
            <button @click="say" text="送出">


            <span id="name">{{chatData.name}} : </span>
            <!-- <input type="text" name="name" id="name" placeholder="暱稱" value=> -->
            <input type="text" name="msg" id="msg" placeholder="說點什麼？">
            <button @click="say" text="送出">

          </form>
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
        name: '',
        msg: '',
        token: sessionStorage.token,
        roomid: 'roomA',
      },
      peopleOnline: '',
      status: '',
      msgs: [],
      token: sessionStorage.token,

    }
    

  },
  methods: {
  
    isOnline(){
      this.$socket.emit('isOnline',this.token);
    },
    say(){
      //call backend
      console.log('say');
      this.$socket.emit('say', this.chatData);
      this.chatData.msg = '';
    },
    join(){
      this.$socket.emit('join',this.chatData);

      console.log('join');
    },
  },
  sockets: {
    connect(){
      this.status = 'Connceted';
      console.log('aaaa')
    },
    online(count){
      this.peopleOnline = count;
      console.log(count);
    },
    disconnect(){
      this.status = 'disConnceted';
    },
    tokenStatus(memberData)
    {
      console.log(memberData);
    },
    memberName(memberAcc)
    {
      this.chatData.name = memberAcc;
      sessionStorage.setItem('name',memberAcc);
      console.log(memberAcc);
    },
    message(msg)
    {
      switch(msg.event){
        case 'join':
          console.log('event join');
          console.log(msg.data.name);
          break;
      }
      // if(msg.data.username!==sessionStorage.userAcc) {
      //   console.log(msg.data.username + '说: ' + msg.data.text);
      //   showMessage(msg.data);
      // }
    },
  },
  mounted() {
    sessionStorage.setItem('token',window.name);
    this.isOnline();
    this.join();

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
