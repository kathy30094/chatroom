const express = require('express');
const app = express();

app.use(express.static(__dirname + '/dist'));
app.get('/', function(req, res){
  res.sendfile('index.html');
});

const server = require('http').Server(app);
const io = require('socket.io')(server);

const _ = require('underscore');

const mysql = require('mysql2/promise');
const mysqlConnectionData = {
    host    : 'localhost',
    user    : 'saaa',
    password: 'dk3u31j4dk3u3',
    database: 'company'
};

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

//end   async-redis settings

//redisAdapter
    const redis = require('redis');
    const redisAdapter  = require('socket.io-redis');
    const pub = redis.createClient();
    const sub = redis.createClient();
    io.adapter(redisAdapter({pubClient: pub, subClient: sub}));

    pub.on('ready',function(err){
        console.log('redis ready');
    });
//end redisAdapter

var memberdata = {};
var memberSockets = [];
var membersInRoom = [];

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
        
        announceList = await redisClient_announce.keys(roomBelong+':*');
        console.log('get announce from '+ roomBelong );
        deAnnounceList = [];
        
        if(announceList)
        {
            announceList.forEach(announce => {
                deAnnounceList.push(decodeURIComponent(announce));
            });
            console.log(roomBelong+'  announceList : '+deAnnounceList);
            socket.emit('message',{"event":'getAnnounce', "data": deAnnounceList});
            return deAnnounceList;
        }
            
    }

    async function roomSaveJoinEmit(roomBelong, toJoin, Acc, socketid)
    {
        roomToJoin = toJoin+':current';
        await io.of('/').adapter.remoteJoin(socketid, toJoin, (err) => {
            if (err) { console.log('join error'); }
            console.log(socketid + ' join success');
        });
        
        membersInRoom = [];
        //加入redis房間  .set(roomXXXX, [member array])
        membersInRoomRedis = await redisClient_room.get(roomToJoin);

        if(membersInRoomRedis != null)
        {
            membersInRoom = JSON.parse(membersInRoomRedis);
            
            if(membersInRoom.indexOf(Acc) == -1)
            {
                membersInRoom.push(Acc);
                await redisClient_room.set(roomToJoin, JSON.stringify(membersInRoom));
                console.log("member in "+roomToJoin + " : "+ membersInRoom);
            }
            else
                console.log('member '+Acc+' already in '+roomToJoin);
        }
        else
        {
            membersInRoom.push(Acc);
            await redisClient_room.set(roomToJoin, JSON.stringify(membersInRoom));
            console.log("member in "+roomToJoin + " : "+ membersInRoom+"    new room");
        }

        //向 room內所有Agent&Player發布所有room內在線名單
        if(roomToJoin != roomBelong+'_:'+roomBelong)//不向player公佈所有在roomAgentX的名單
            io.in(toJoin).emit('membersInRoom',{'roomName': toJoin,'members': membersInRoom});

        //對Agent發布room內的名單
        io.to(roomBelong+'_:Agent').emit('membersInRoom',{'roomName': toJoin,'members': membersInRoom});

        console.log('room data : '+roomToJoin+'     '+membersInRoom);

        if(socketid ==socket.id)//目前分頁進入房間後，接著拿取房間的公告
        {
            deAnnounceList = await getAnnounce(toJoin);
            return deAnnounceList;
        }
        else
            return null;
    }

    async function leaveBySocketID(socketid, roomName)
    {
        io.of('/').adapter.remoteLeave(socketid, roomName, (err) => {
            if (err) { console.log(err); }
            console.log(socketid+' leave success');
        });
    }

    socket.on('leaveRoom', async (leaveData) => {

        memberdata = await authAndGetAcc(leaveData.token);
        roomName = memberdata.roomBelong+'_:'+leaveData.roomName;
        
        //檢查Mysql內是否包含要刪的項目
        const mysqlConnection = await mysql.createConnection(mysqlConnectionData);
        var checkExist = await mysqlConnection.execute('SELECT * FROM `roomData` WHERE `roomName` = ? AND `member` = ?',[roomName, memberdata.Account]);
        if(checkExist[0].length != 0)
        {
            await mysqlConnection.execute('DELETE FROM `roomData` WHERE `roomName` = ? AND `member` = ?',[roomName, memberdata.Account]);

            //leave
            memberSockets = JSON.parse(await redisClient_onlineAcc.get(memberdata.Account)).socketid;
            console.log(memberSockets);

            //roomData:Acc 更新
            roomData = JSON.parse(await redisClient_onlineAcc.get('roomData:'+memberdata.Account));
            roomData.splice(roomData.indexOf(roomName),1);
            await redisClient_onlineAcc.set('roomData:'+memberdata.Account, JSON.stringify(roomData));

            //show給前端頁面自己在的room，除了roomAgentX_:roomAgentX
            rooms = JSON.parse(await redisClient_onlineAcc.get('roomData:'+memberdata.Account));
            rooms.splice(rooms.indexOf(memberdata.roomBelong+'_:'+memberdata.roomBelong),1);
            
            for(var socketid of memberSockets)
            {
                await leaveBySocketID(socketid, roomName);
                socket.broadcast.to(socketid).emit('allRooms', rooms);
            }
            socket.emit('allRooms', rooms);

            //roomAgentX_:roomName:all 更新
            membersInRoom_all = JSON.parse(await redisClient_room.get(roomName+':all'));
            membersInRoom_all.splice(membersInRoom_all.indexOf(memberdata.Account),1);

            //如果room內有人，更新room
            if(membersInRoom_all.length!=0)
                await redisClient_room.set(roomName+':all', JSON.stringify(membersInRoom_all));
            //如果room內沒人，刪除room//對Agent & room成員 更新目前存在的房間清單
            else
            {
                await redisClient_room.del(roomName+':all');

                var roomList = await redisClient_room.keys(memberdata.roomBelong+'*');
                var roomToShow = [];
                roomList.forEach(element => {
                    if(element.slice(-4)==':all')
                        roomToShow.push(element.slice(0,-4));
                });
                io.in(memberdata.roomBelong+'_:Agent').emit('allRooms',roomToShow);
            }
                
            //roomAgentX_:roomName:current 更新
            membersInRoom = JSON.parse(await redisClient_room.get(roomName+':current'));
            membersInRoom.splice(membersInRoom.indexOf(memberdata.Account),1);
            
            //如果room內沒人，刪除room
            if(membersInRoom.length==0)
                await redisClient_room.del(roomName+':current');
            else
            {
                await redisClient_room.set(roomName+':current', JSON.stringify(membersInRoom));
                io.in(roomName).emit('membersInRoom',{'roomName': roomName,'members': membersInRoom});
            }

        }
    });

    socket.on('joinRoom', async (joinData) => {

        memberdata = await authAndGetAcc(joinData.token);
        roomName = memberdata.roomBelong+'_:'+joinData.roomName;

        //檢查是否有此資料
        const mysqlConnection = await mysql.createConnection(mysqlConnectionData);
        var checkExist = await mysqlConnection.execute('SELECT * FROM `roomData` WHERE `roomName` = ? AND `member` = ?',[roomName, memberdata.Account]);
        if(checkExist[0].length == 0)
        {
            //新增mysql內容  roomName / Acc
            await mysqlConnection.execute('INSERT INTO `roomData`(`roomName`, `member`) VALUES (?,?)',[roomName, memberdata.Account]);
            
            //roomData:Acc 更新
            roomData = JSON.parse(await redisClient_onlineAcc.get('roomData:'+memberdata.Account));
            roomData.push(roomName);
            await redisClient_onlineAcc.set('roomData:'+memberdata.Account, JSON.stringify(roomData));

            //show給前端頁面自己在的room，除了roomAgentX_:roomAgentX
            rooms = JSON.parse(await redisClient_onlineAcc.get('roomData:'+memberdata.Account));
            rooms.splice(rooms.indexOf(memberdata.roomBelong+'_:'+memberdata.roomBelong),1);
            
            //join by sockets
            memberSockets = JSON.parse(await redisClient_onlineAcc.get(memberdata.Account)).socketid;
            for(var socketid of memberSockets)
            {
                checkAnnounceList = await roomSaveJoinEmit(memberdata.roomBelong, roomName, memberdata.Account, socketid);
                if(checkAnnounceList!=null)
                    deAnnounceList = checkAnnounceList;
                    
                socket.broadcast.to(socketid).emit('allRooms', rooms);
            }
            socket.emit('allRooms', rooms);
            
            //有公告
            if(deAnnounceList!=null)
                for(var socketid of memberSockets)
                {
                    socket.broadcast.to(socketid).emit('message',{"event":'getAnnounce', "data": deAnnounceList});
                    
                }
                
            //roomAgentX_:roomName:all 更新
            roomMember = JSON.parse(await redisClient_room.get(roomName+':all'));

            //已經有這個房間
            if(roomMember != null)
            {
                roomMember.push(memberdata.Account);
                await redisClient_room.set(roomName+':all',JSON.stringify(roomMember));
            }
            //新room，對Agent更新room清單
            else
            {
                await redisClient_room.set(roomName+':all',JSON.stringify([memberdata.Account]));

                var roomList = await redisClient_room.keys(memberdata.roomBelong+'*');
                var roomToShow = [];
                roomList.forEach(element => {
                    if(element.slice(-4)==':all')
                        roomToShow.push(element.slice(0,-4));
                });
                io.in(memberdata.roomBelong+'_:Agent').emit('allRooms',roomToShow);
            }
        }
        

    });

    //一登入就進來登記
    socket.on('isOnline',async (token) => {

        console.log(token);

        memberdata = await authAndGetAcc(token);

        //上線的人存到redis  

        let memberMsg = {
            Acc: memberdata.Account,
            roomBelong: memberdata.roomBelong,
        };
        socket.emit('showSelfMsg',memberMsg);

        //加入自己屬於的房間
        rooms = JSON.parse(await redisClient_onlineAcc.get('roomData:'+memberdata.Account));
        for(let room of rooms)
            await roomSaveJoinEmit(memberdata.roomBelong,room,memberdata.Account,socket.id);

        //show給前端頁面自己在的room，除了roomAgentX_:roomAgentX
        rooms = JSON.parse(await redisClient_onlineAcc.get('roomData:'+memberdata.Account));
        rooms.splice(rooms.indexOf(memberdata.roomBelong+'_:'+memberdata.roomBelong),1);
        socket.emit('allRooms',rooms);

        //Acc 與 socketid & token 對照
        socketAndToken = await redisClient_onlineAcc.get(memberdata.Account);
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

        //socketid 與 Acc對照
        await redisClient_onlineSocket.set(socket.id, memberdata.Account);
            
    });
    
    socket.on("say", async (chatData) => {

        memberdata = await authAndGetAcc(chatData.token);

        //ret
        var retData={
            Acc: memberdata.Account,
            msg: chatData.msg,
            chatSelect: chatData.chatSelect,  
        };

        console.log("chatSelect : "+chatData.chatSelect);

        //redis所有room清單
        var rooms = await redisClient_room.keys('*');

        if(rooms.includes(chatData.chatSelect+':all'))//redis清單內有這個room
        {
            if(typeof socket.adapter.rooms[chatData.chatSelect]!='undefined')
            {
                //找到已經在room裡的成員
                var peopleInRoom=Object.keys(socket.adapter.rooms[chatData.chatSelect].sockets);

                //檢查自己有沒有在裡面   //增加限制條件，不可對roomAgentX講話
                if(peopleInRoom.includes(socket.id) || chatData.chatSelect != memberdata.roomBelong)
                    io.in(chatData.chatSelect).emit('message',{'event':'say', 'data': retData});
            }
        }
        //私聊
        else
        {
            var socketsIdChatTo = JSON.parse(await redisClient_onlineAcc.get(chatData.chatSelect));
            if(socketsIdChatTo != null)
            {
                //給對象
                socketsIdChatTo.socketid.forEach(socketIdto => {
                    socket.to(socketIdto).emit('message',{'event':'say', 'data': retData});
                });

                //給自己
                selfData = JSON.parse(await redisClient_onlineAcc.get(memberdata.Account));
                selfData.socketid.forEach(socketIdto => {
                    socket.to(socketIdto).emit('message',{'event':'say', 'data': retData});
                });
                socket.emit('message',{'event':'say', 'data': retData});
            }
            
        }
    });

    // 有人離線了
    socket.on('disconnect', async () => {

        //查詢Acc後，刪除 socketid對照
        var AccLeave = await redisClient_onlineSocket.get(socket.id);
        await redisClient_onlineSocket.del(socket.id);

        //有登入，儲存過socket id 到 redis
        if(AccLeave != null)
        {
            socketAndToken = JSON.parse(await redisClient_onlineAcc.get(AccLeave));

            //如果 某Acc 關閉最後一個分頁，要把Acc從上線中的名單移除，也從各個room中移除
            if(socketAndToken.socketid.length <= 1)
            {
                //從上線名單中移除
                await redisClient_onlineAcc.del(AccLeave);
                console.log(AccLeave+' leave all chat');

                //找出所有Acc加入的room，去每個房間裡看
                allRooms = JSON.parse(await redisClient_onlineAcc.get('roomData:'+AccLeave));
                for(let i = 0;i<allRooms.length;i++)
                {
                    membersInRoom = JSON.parse(await redisClient_room.get(allRooms[i]+':current'));

                    //移除
                    membersInRoom.splice(membersInRoom.indexOf(AccLeave),1);
                    
                    //如果room內沒人，刪除room
                    if(membersInRoom.length==0)
                        await redisClient_room.del(allRooms[i]+':current'); //如果移除了Acc之後，room裡面就沒人了，刪除沒人的room

                    //room內還有人，向room內所有人更新room內人員名單
                    else
                    {
                        await redisClient_room.set(allRooms[i]+':current', JSON.stringify(membersInRoom));
                        io.in(allRooms[i]).emit('membersInRoom',{'roomName': allRooms[i],'members': membersInRoom});
                    }
                    console.log('member in room '+allRooms[i]+' :  '+membersInRoom);

                }
            }
            else  //拿掉指定的socketid from array
            {
                socketAndToken.socketid = _.without(socketAndToken.socketid, socket.id);

                await redisClient_onlineAcc.set(AccLeave, JSON.stringify(socketAndToken));
                console.log(AccLeave+" socket left : "+ JSON.stringify(socketAndToken));
            }
        }
    });
});

server.listen(3000, (req, res) => {
    console.log("server started. http://localhost:3000");
});
