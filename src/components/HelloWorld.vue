<template>
  <div class="hello">
    <div id="count"></div>
    <div id="container">
      <div id="status-box">
          Server: 
          <span id="status">aaaaa</span> / <span id="online">0</span> online.
      </div>
      <ul>
        <li v-for="msg in msgs">
          {{msg}}
        </li>
      </ul>
      <!-- <div id="content">
      </div> -->
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
      chatData{

      },
      msgs: [],
      msg: '',
      msgMe: '',
    }
    

  },
  methods: {
    sendToEveryone(){
      //call backend
      this.$socket.emit('send', this.msg);
      this.msg = '';
    }
  }
}

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
