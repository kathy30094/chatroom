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

const redisClient_room = asyncRedis.createClient();
redisClient_room.select(4);

const redisClient_announce = asyncRedis.createClient();
redisClient_announce.select(5);

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
var membersInRoom = [];
//connection

io.on('connection', (socket) => {

    console.log('Hello!');  // 顯示 Hello!

    async function authAndGetAcc(token)
    {
        var res = await redisClient_token.get(token);
        //console.log("res :    "+res);

        if(res != null)
        {
            data = JSON.parse(res);
            console.log(res);
            return data;
        }
        else
        {
            memberdata = {};
            socket.emit('notLogined');
        }
    };
    
    async function getAnnounce(roomBelong)
    {
        
        announceList = await redisClient_announce.keys('__'+roomBelong+'__'+'*');
        console.log('get announce from '+ roomBelong );
        deAnnounceList = [];
        announceList.forEach(announce => {
            deAnnounceList.push(decodeURIComponent(announce));
        });
        if(announceList)
            socket.emit('message',{"event":'getAnnounce', "data": deAnnounceList});
    }

    //一登入就進來登記
    socket.on('isOnline',async (token) => {

        io.of('/').adapter.clients((err,clients) => {
            console.log('clients :   '+clients);
        });
        
        console.log(token);

        var res = await redisClient_token.get(token);
        //console.log("res :    "+res);

        if(res != null)
        {
            memberdata = JSON.parse(res);

            //上線的人存到redis  
            if(typeof memberdata.Account != 'undifined')
            {
                let memberMsg = {
                    Acc: memberdata.Account,
                    roomBelong: memberdata.roomBelong,
                };
    
                socket.emit('showSelfMsg',memberMsg);

                //進入房間後，接著拿取房間的公告
                socket.join(memberdata.roomBelong);
                await getAnnounce(memberdata.roomBelong);

                //加入房間(roomAgentX,member array)
                membersInRoomRedis = await redisClient_room.get(memberdata.roomBelong);

                if(membersInRoomRedis != null)
                {
                    membersInRoom = JSON.parse(membersInRoomRedis);
                    
                    if(membersInRoom.indexOf(memberdata.Account) == -1)
                    {
                        membersInRoom.push(memberdata.Account);
                        await redisClient_room.set(memberdata.roomBelong, JSON.stringify(membersInRoom));
                        console.log("member in "+memberdata.roomBelong + " : "+ membersInRoom);
                    }
                    else
                        console.log('member '+memberdata.Account+' already in '+memberdata.roomBelong);
                        
                }
                else
                {
                    membersInRoom.push(memberdata.Account);
                    await redisClient_room.set(memberdata.roomBelong, JSON.stringify(membersInRoom));
                    console.log("member in "+memberdata.roomBelong + " : "+ membersInRoom+"    new room");
                }


                //加入(Acc,socket id array)
                socketAndToken = await redisClient_onlineAcc.get(memberdata.Account);
                // console.log('socketAndToken : '+ typeof socketAndToken + socketAndToken);

                if(socketAndToken != null)
                {
                    memberSockets = JSON.parse(socketAndToken).socketid;
                    memberTokens = JSON.parse(socketAndToken).token;
                }
                else
                {
                    memberSockets = [];
                    memberTokens = [];
                }
                    
                memberSockets.push(socket.id);
                if(!memberTokens.includes(token))
                    memberTokens.push(token);

                let socketAndTokenToSave = {
                    'socketid': memberSockets,
                    'token' : memberTokens
                };

                console.log("Acc " + memberdata.Account+" SocketAndTokenToSave after push : "+JSON.stringify(socketAndTokenToSave));

                await redisClient_onlineAcc.set(memberdata.Account, JSON.stringify(socketAndTokenToSave));

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

    // //      待改
    // socket.on('join', async (data) => {
        
        //     var res = await redisClient_token.get(data.token);

        //     if(res != null)
        //         memberdata = JSON.parse(res);
        //     else
        //         memberdata = {};
                
        //     if(memberdata != null)
        //     {
        //         data.roomids.forEach(roomid => {

        //             //檢查member是否已經加入過room
        //             //room 還沒被任何人加入過  或  room內沒有包含指定的socket id
        //             if(typeof socket.adapter.rooms[roomid]=='undefined'|| Object.keys(socket.adapter.rooms[roomid].sockets).includes(socket.id)==false)
        //             {
        //                 socket.join(roomid);
        //                 console.log('join roomid = '+roomid)
        //                 console.log(socket.adapter.rooms[roomid].sockets);
        //                 var retData={
        //                     Acc: memberdata.Account,
        //                     token: data.token,
        //                     roomid: roomid,
        //                 }
        //                 console.log(retData.Acc);

        //                 socket.broadcast.to(roomid).emit('message', {"event":'join', "data": retData});
        //                 console.log('retdata'+retData);
        //             }
        //         });   
        //     };
    // });
    
    socket.on("say", async (chatData) => {

        var res = await redisClient_token.get(chatData.token);
        if(res != null)
            memberdata = JSON.parse(res);
        else
            memberdata = {};

        if(memberdata != null)
        {
            console.log("chatSelect : "+chatData.chatSelect);
            //ret
            var retData={
                Acc: memberdata.Account,
                msg: chatData.msg,
                chatSelect: chatData.chatSelect,  
            };

            //redis所有room清單
            var rooms = await redisClient_room.keys('*');

            //對所有人  //player不能對所有人說話
            // if(chatData.chatSelect=='all')
            //     io.emit('message',{'event':'say', 'data': retData});
            //對room
            if(rooms.includes(chatData.chatSelect))//redis清單內有這個room
            {
                if(typeof socket.adapter.rooms[chatData.chatSelect]!='undefined')
                {
                    //找到已經在room裡的成員
                    var peopleInRoom=Object.keys(socket.adapter.rooms[chatData.chatSelect].sockets);

                    //檢查自己有沒有在裡面
                    if(peopleInRoom.includes(socket.id))
                        io.in(chatData.chatSelect).emit('message',{'event':'say', 'data': retData});
                }
            }
            //私聊
            else
            {
                //給自己    //////////////////////////////////////////待改
                socket.emit('message',{'event':'say', 'data': retData});

                //給對象
                var socketsIdChatTo = JSON.parse(await redisClient_onlineAcc.get(chatData.chatSelect));
                socketsIdChatTo.forEach(socketIdto => {
                    socket.to(socketIdto).emit('message',{'event':'say', 'data': retData});
                });
            }
        }
    });

    socket.on('disconnect', async () => {
        // 有人離線了
        //redids
        var AccLeave = await redisClient_onlineSocket.get(socket.id);

        //有登入，儲存過socket id 到 redis
        if(AccLeave != null)
        {
            await redisClient_onlineSocket.del(socket.id);

            socketAndToken = JSON.parse(await redisClient_onlineAcc.get(AccLeave));

            //如果 某Acc 關閉最後一個分頁，要把Acc從上線中的名單移除，也從各個room中移除
            if(socketAndToken.socketid.length <= 1)
            {
                //從上線名單中移除
                await redisClient_onlineAcc.del(AccLeave);
                console.log(AccLeave+' leave all chat');

                //找出所有已存在的房間，去每個房間裡看
                allRooms = Object.values(await redisClient_room.keys('*'));
                console.log('allRoom : '+typeof allRooms+allRooms+allRooms.length);

                //巡每個room，看Acc有沒有在裡面
                for(let i = 0;i<allRooms.length;i++)
                {
                    membersInRoom = JSON.parse(await redisClient_room.get(allRooms[i]));
                    console.log('membersinroom : '+membersInRoom);

                    //如果AccLeave有在room裡
                    if(membersInRoom.indexOf(AccLeave)!=-1)
                    {
                        //移除
                        membersInRoom.splice(membersInRoom.indexOf(AccLeave),1);
                        
                        if(membersInRoom.length==0)
                            await redisClient_room.del(allRooms[i]); //如果移除了Acc之後，room裡面就沒人了，刪除沒人的room
                        else
                            await redisClient_room.set(allRooms[i], JSON.stringify(membersInRoom));

                        console.log('member in room '+allRooms[i]+' :  '+membersInRoom)
                    }
                }
            }
            else
            {
                //拿掉指定的socketid from array
                memberSockets = _.without(memberSockets, socket.id);

                socketAndToken.socketid = memberSockets;

                await redisClient_onlineAcc.set(AccLeave, JSON.stringify(socketAndToken));
                console.log(AccLeave+" socket left : "+ JSON.stringify(socketAndToken));
            }

            //在線上的所有member
            var memberOnlineArray = await redisClient_onlineAcc.keys('*');
            console.log('AccList after Leave : '+memberOnlineArray);

            io.emit('showAllMember',memberOnlineArray);
        }
        memberSockets = [];
    });
});

server.listen(3000, (req, res) => {
    console.log("server started. http://localhost:3000");
});
