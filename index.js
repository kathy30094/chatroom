const express = require('express');
const app = express();

const server = require('http').Server(app);
const io = require('socket.io')(server);

app.use(express.static(__dirname + '/dist'));
app.get('/', function(req, res){
  res.sendfile('index.html');
});
let onlineCount = 0;

io.on('connection', (socket) => {
    console.log('Hello!');  // 顯示 Hello!

    onlineCount++;

    io.emit("onlinee", onlineCount);

    socket.on("greeeet", () => {
        io.emit("greeeet", onlineCount);
        console.log(onlineCount);
    });

    socket.on('disconnect', () => {
        // 有人離線了，扣人
        onlineCount = (onlineCount < 0) ? 0 : onlineCount-=1;
        io.emit("onlinee", onlineCount);
    });
    socket.on("send", (msg) => {
        console.log(msg)
    });
    
    // 修改 console.log 成 io.emit
    socket.on("send", (msg) => {
        // 廣播訊息到聊天室
        io.emit("msg", msg);
    });

    // 當發生離線事件
    // socket.on('disconnect', () => {
    //     console.log('Bye~');  // 顯示 bye~
    // });
});



server.listen(3000, () => {
    console.log("server started. http://localhost:3000");
});



