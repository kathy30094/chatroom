const express = require('express');
const app = express();

app.use(express.static(__dirname + '/dist'));
app.get('/', function(req, res){
  res.sendfile('index.html');
});

const server = require('http').Server(app);
const io = require('socket.io')(server);

const _ = require('underscore');

//async-redis settings
const asyncRedis = require("async-redis");

const redisClient_token = asyncRedis.createClient();
redisClient_token.select(0);

const redisClient_onlineAcc = asyncRedis.createClient();
redisClient_onlineAcc.select(2);

const redisClient_onlineSocket = asyncRedis.createClient();
redisClient_onlineSocket.select(3);

//redisAdapter
const redis = require('redis');
const redisAdapter  = require('socket.io-redis');
const pub = redis.createClient();
const sub = redis.createClient();
io.adapter(redisAdapter({pubClient: pub, subClient: sub}));

pub.on('ready',function(err){
    console.log('redis ready');
});

//var memberOnline = {};
var memberOnlineArray = [];
var memberdata = {};
var memberSockets = [];
//connection
io.on('connection', (socket) => {

    console.log('Hello!');  // 顯示 Hello!
    
    //一登入就進來登記
    socket.on('isOnline',async (token) => {

        io.of('/').adapter.clients((err,clients) => {
            console.log('clients :   '+clients);
        });
        
        console.log(token);
        var res = await redisClient_token.get(token);

        if(res != null)
        {
            memberdata = JSON.parse(res);

            socket.emit('showSelfAcc',memberdata.Account);

            if(typeof memberdata.Account != 'undifined')
            {
                //上線的人存到redis

                
                //單處登入 單socket
                //await redisClient_onlineAcc.set(memberdata.Account,socket.id);  
                
                //改為加入socket id array
                memberDataInRedis = await redisClient_onlineAcc.get(memberdata.Account);
                if(memberDataInRedis != null)
                {
                    memberSockets = memberDataInRedis;
                    memberSockets.push(socket.id);
                }
                else
                    memberSockets.push(socket.id);
                console.log(memberSockets);
                await redisClient_onlineAcc.set(memberdata.Account, memberSockets);


                await redisClient_onlineSocket.set(socket.id, memberdata.Account);
                memberOnlineArray = await redisClient_onlineAcc.keys('*');

                console.log('memberOnlineArray : ' + memberOnlineArray);

                io.emit('showAllMember',memberOnlineArray);
                
                console.log("member Acc " + memberdata.Account+', member sockeet id '+ socket.id + " is online");
            }
        }  
        else
        {
            memberdata = {};
            socket.emit('notLogined');
        }
            
    });

    socket.on('join', async (data) => {
        
        var res = await redisClient_token.get(data.token);

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

        var res = await redisClient_token.get(chatData.token);
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

                if(typeof socket.adapter.rooms[roomid]!='undefined')
                {
                    //找到已經在room裡的成員
                    var peopleInRoom=Object.keys(socket.adapter.rooms[roomid].sockets);

                    //檢查自己有沒有在裡面
                    if(peopleInRoom.includes(socket.id))
                        io.in(roomid).emit('message',{'event':'say', 'data': retData});
                }
            }
            //私聊
            else
            {
                //redis
                var socketIDto = await redisClient_onlineAcc.get(chatData.chatSelect);

                socket.emit('message',{'event':'say', 'data': retData});
                socket.to(socketIDto).emit('message',{'event':'say', 'data': retData});
            }
        }
    });

    socket.on('disconnect', async () => {
        // 有人離線了
        //redids
        var AccLeave = await redisClient_onlineSocket.get(socket.id);
        await redisClient_onlineSocket.del(socket.id);
        //單處登入 單socket
        //await redisClient_onlineAcc.del(AccLeave);
        AccSocketsArray = await redisClient_onlineAcc.get(AccLeave);
        if(AccSocketsArray.length == 1 || AccSocketsArray.length == 0)
        {
            await redisClient_onlineAcc.del(AccLeave);
        }
        else
        {
            //拿掉指定的socketid from array
        }

        var memberOnlineArray = await redisClient_onlineAcc.keys('*');
        console.log('AccList after Leave : '+memberOnlineArray);

        io.emit('showAllMember',memberOnlineArray);

        io.of('/').adapter.clients((err,clients) => {
            console.log('clients :   '+clients);
        });
    });
});

server.listen(3000, (req, res) => {
    console.log("server started. http://localhost:3000");

});
