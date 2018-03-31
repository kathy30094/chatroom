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
              <input type="text" name="name" id="name" placeholder="暱稱">
              <input type="text" name="msg" id="msg" placeholder="說點什麼？">
              <input type="submit" value="送出">
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
  name: 'HelloWorld',
  data(){
    return{
      chatData: {
        name: '',
        msg: '',
      },
      peopleOnline: '',
      status: '',
      msgs: [],

    }
    

  },
  methods: {
    // sendForm.addEventListener("submit", function(e){
      //   e.preventDefault(); //阻止元素发生默认的行为（例如，当点击提交按钮时阻止对表单的提交

      //   var formData = {};
      //   var formChild = sendForm.children;

      //   for (var i=0; i< sendForm.childElementCount; i++) {
      //       var child = formChild[i];
      //       if (child.name !== "") {
      //           formData[child.name] = child.value;
      //       }
      //   }
      //   socket.emit("send", formData);
    // });
    sendToEveryone(){
      //call backend
      this.$socket.emit('send', this.chatData.msg);
      this.chatData.msg = '';
    },
    test(){
      this.$socket.emit('test','test');
    },
    
  },
  sockets: {
    ['connect'] (){
      this.status = 'Connceted';
    },
    ['onlinee'](count){
      this.peopleOnline = count;
    },
    ['disconnect'](){
      this.status = 'disConnceted';
    },
    
  },
  mounted() {
    this.test();

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
