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

var process = require('process');

let onlineCount = 0;



//connection
io.on('connection', (socket) => {
    var memberdata = {};

    console.log('Hello!');  // 顯示 Hello!
    
    onlineCount++;
    
    //一登入就進來登記
    socket.on('isOnline',(token) => {
        
        console.log(token);

        redisClient.get(token,(error, res) => {
            if(res != null)
                memberdata = JSON.parse(res);
            else
                memberdata = {};
        });
        if(memberdata != null)
        {
            socket.emit('memberAcc',memberdata.Account);
        }
    });

    socket.on('join', (data) => {

        
        redisClient.get(data.token, (err,res) => {
            if(res != null)
                memberdata = JSON.parse(res);
            else
                memberdata = {};
        });

        if(memberdata != null)
        {
            data.roomids.forEach(roomid => {
                console.log('join roomid = '+roomid)
                socket.join(roomid);

                var retData={
                    Acc: memberdata.Account,
                    token: data.token,
                    roomid: roomid,
                }
                console.log('retdata'+retData);
                socket.broadcast.in(roomid).emit('message', {"event":'join', "data": retData});
            });   
        };
    });

    socket.on('disconnect', () => {
        // 有人離線了，扣人
        onlineCount = (onlineCount < 0) ? 0 : onlineCount-=1;
        io.emit("online", onlineCount);
    });
    
    socket.on("say", (chatData) => {

        redisClient.get(chatData.token, (err,res) => {
            if(res != null)
                memberdata = JSON.parse(res);
            else
                memberdata = {};
            
        });

        if(memberdata != null)
        {
            var retData={
                Acc: memberdata.Account,
                msg: chatData.msg,
                roomid: chatData.roomid,  
            };

            if(chatData.roomid=='all')
                io.emit('message',{'event':'say', 'data': retData});
            else
            {
                //檢查member是否為此room的成員
                rooms=socket.adapter.rooms[chatData.roomid];
                if(rooms!=null)
                    io.in(chatData.roomid).emit('message',{'event':'say', 'data': retData});

                // JSON.stringify(rooms);
                // console.log("rooms  "+ JSON.stringify(rooms));
            }
        }
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
