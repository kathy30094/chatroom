const express = require('express');
const app = express();

app.use(express.static(__dirname + '/dist'));
app.get('/', function(req, res){
  res.sendfile('index.html');
});

const server = require('http').Server(app);
const io = require('socket.io')(server);

const redis = require('redis');
const redisClient = redis.createClient();
//test redis status
redisClient.on('ready',function(err){
    console.log('redis ready');
});

// const pub = redis.createClient();
// const sub = redis.createClient();
var process = require('process');

let onlineCount = 0;


//connection
io.on('connection', (socket) => {

    console.log('Hello!');  // 顯示 Hello!
    //console.log(socket);
    
    onlineCount++;

    socket.on('join', (data) => {

        //console.log('join token'+data.token);

        redisClient.get(data.token, (err,res) => {
            console.log('res'+res);
            var memberdata = JSON.parse(res);
            if(res != null)
            {
                
                data.roomids.forEach(roomid => {
                    console.log('join roomid = '+roomid)
                    socket.join(roomid);
                    var retData={
                        name: memberdata.Account,
                        token: data.token,
                        roomid: roomid,
                    }
                    socket['room']=roomid;
                    console.log('retdata'+retData);
                    socket.broadcast.in(socket['room']).emit('message', {"event":'join', "data": retData});
                });   
            };
        //var rooms = socket.adapter.rooms;
        //console.log(rooms);
        });

    });
    
    socket.on('isOnline',(token) => {

        console.log(token);
        redisClient.get(token,(error, res) => {
            //console.log(res);
            if(res != null)
            {
                var memberdata = JSON.parse(res);
                socket.emit('memberName',memberdata.Account);
            }
        });
        
        io.emit("online", onlineCount);
    });

    socket.on('disconnect', () => {
        // 有人離線了，扣人
        onlineCount = (onlineCount < 0) ? 0 : onlineCount-=1;
        io.emit("online", onlineCount);
    });
    
    socket.on("say", (chatData) => {

        console.log('msg : '+chatData.msg);
        redisClient.get(chatData.token, (err,res) => {
            console.log('res'+res);
            var memberdata = JSON.parse(res);
            if(chatData.roomid=='all')
            {
                let retData={
                    name: memberdata.Account,
                    msg: chatData.msg,
                    roomid: chatData.roomid,  
                };
                io.emit('message',{'event':'say', 'data': retData});
            }
            else
            {}
        });

        
    });

    socket.on('test', (test) => {
        console.log(test);
    });

    //redis 方法
        // socket.on('join', function (data) {

        //     socket.join(roomid);    //加入房间

        //     // 往redis订阅房间id
        //     if(!roomSet[roomid]){
        //         roomSet[roomid] = {};
        //         console.log('sub channel ' + roomid);
        //         sub.subscribe(roomid);
        //     }

        //     roomSet[roomid][data.token] = {};
        //     //reportConnect();
        //     console.log(data.name + ' join');
        //     roomSet[roomid][data.token].name = data.name;
        //     // 往该房间id的reids channel publish用户进入房间消息
        //     pub.publish(roomid, JSON.stringify({"event":'join',"data": data}));
        // });

        // //用户发言 推送消息到redis
        // socket.on('say', function (data) {
        //     console.log("Received Message: " + data.msg);
        //     pub.publish(roomid, JSON.stringify({"data": {
        //       name: roomSet[roomid][data.token].name,
        //       msg: data.msg
        //     }}));
        // });

        // ///往对应房间广播消息
        // sub.on("message", function (channel, message) {
        //     console.log("message channel " + channel + ": " + message);
        //     //往对应房间广播消息
        //     socket.to(channel).emit('message', JSON.parse(message));
        // });
    //
});

server.listen(3000, (req, res) => {
    console.log("server started. http://localhost:3000");

});
