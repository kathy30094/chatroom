const express = require('express');
const app = express();

app.use(express.static(__dirname + '/dist'));
app.get('/', function(req, res){
  res.sendfile('index.html');
});

const server = require('http').Server(app);
const io = require('socket.io')(server);

const _ = require('underscore');

const asyncRedis = require("async-redis");
const redisClient = asyncRedis.createClient();

// test redis status
redisClient.on('ready',function(err){
    console.log('redis ready');
});

var memberOnline = {};
var memberOnlineArray = [];
var memberdata = {};
//connection
io.on('connection', (socket) => {

    

    console.log('Hello!');  // 顯示 Hello!
    
    //一登入就進來登記
    socket.on('isOnline',async (token) => {

        console.log(token);
        var res = await redisClient.get(token);

        if(res != null)
            memberdata = JSON.parse(res);
        else
            memberdata = {};

        if(memberdata != null)
        {
            socket.emit('showSelfAcc',memberdata.Account);

            await redisClient.set(memberdata.Account, socket.id);

            memberOnline[memberdata.Account] = socket.id;
            memberOnlineArray = Object.keys(memberOnline);

            console.log('memberOnlineArray : ' + memberOnlineArray);
            io.emit('showAllMember',memberOnlineArray);
            
            console.log("member Acc " + memberdata.Account+', member sockeet id '+ socket.id + " is online");
        }
    });

    socket.on('join', async (data) => {
        
        var res = await redisClient.get(data.token);

        if(res != null)
            memberdata = JSON.parse(res);
        else
            memberdata = {};
            
        if(memberdata != null)
        {
            data.roomids.forEach(roomid => {

                //檢查member是否已經加入過room
                //room 還沒被任何人加入過  或  room內沒有包含指定的socket id
                if(typeof socket.adapter.rooms[roomid]=='undefined'|| Object.keys(socket.adapter.rooms[roomid].sockets).includes(socket.id)==false)
                {
                    socket.join(roomid);
                    console.log('join roomid = '+roomid)
                    console.log(socket.adapter.rooms[roomid].sockets);
                    var retData={
                        Acc: memberdata.Account,
                        token: data.token,
                        roomid: roomid,
                    }
                    console.log(retData.Acc);

                    socket.broadcast.to(roomid).emit('message', {"event":'join', "data": retData});
                    console.log('retdata'+retData);
                }
            });   
        };
    });
    
    socket.on("say", async (chatData) => {

        var res = await redisClient.get(chatData.token);
        if(res != null)
            memberdata = JSON.parse(res);
        else
            memberdata = {};

        var rooms = ['roomA','roomB','roomC'];

        if(memberdata != null)
        {
            //ret
            var retData={
                Acc: memberdata.Account,
                msg: chatData.msg,
                chatSelect: chatData.chatSelect,  
            };

            //對所有人
            if(chatData.chatSelect=='all')
                io.emit('message',{'event':'say', 'data': retData});
            //對room
            else if(rooms.includes(chatData.chatSelect))
            {
                var roomid = chatData.chatSelect; //縮寫
                // console.log(socket.adapter.rooms[roomid]);
                if(typeof socket.adapter.rooms[roomid]!='undefined')
                {
                    //找到已經在room裡的成員
                    var peopleInRoom=Object.keys(socket.adapter.rooms[roomid].sockets);
                    // console.log('test1 : '+Object.keys(socket.adapter.rooms[roomid].sockets));
                    // console.log('peopleInRoom : '+ peopleInRoom);

                    //檢查自己有沒有在裡面
                    if(peopleInRoom.includes(socket.id))
                        io.in(roomid).emit('message',{'event':'say', 'data': retData});
                }
            }
            //私聊
            else
            {
                var socketIDto = memberOnline[chatData.chatSelect];

                socket.emit('message',{'event':'say', 'data': retData});
                socket.to(socketIDto).emit('message',{'event':'say', 'data': retData});
            }
        }
    });

    socket.on('disconnect', () => {
        // 有人離線了
        
        leaveAcc = _.invert(memberOnline)[socket.id];

        delete memberOnline[leaveAcc];
        
        memberOnlineArray = Object.keys(memberOnline);
        console.log('after leave : '+ memberOnlineArray);

        io.emit('showAllMember',memberOnlineArray);
    });

});

server.listen(3000, (req, res) => {
    console.log("server started. http://localhost:3000");

});
