const express = require('express');
const app = express();

const server = require('http').Server(app);
const io = require('socket.io')(server);

// const bodyParser = require('body-parser');
// //const xml2json=require('xml2json');
// const http = require('http');
// const url = require('url');
// const util = require('util');
// // const querystring = require('querystring');



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
    
    // 修改 console.log 成 io.emit
    socket.on("send", (msg) => {
        // 廣播訊息到聊天室
        io.emit("msg", msg);
    });

    socket.on('test', (test) => {
        console.log(test);
    });
});
////get
    // http.createServer(function(req, res){
    //     res.writeHead(200, {'Content-Type': 'text/plain; charset=utf-8'});
    //     var params = url.parse(req.url, true).query;
    //     res.write("aaa : " + params.token);
    //     console.log('testchatroom');
    //     console.log(params.token);
    //     // res.end(util.inspect(url.parse(req.url, true)));
// }).listen(5000);


server.listen(3000, (req, res) => {
    console.log("server started. http://localhost:3000");

});


