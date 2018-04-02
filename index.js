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

// const pub = redis.createClient();
// const sub = redis.createClient();

var process = require('process');

//test redis status
redisClient.on('ready',function(err){
    console.log('redis ready');
});


let onlineCount = 0;

io.on('connection', (socket) => {
    console.log('Hello!');  // 顯示 Hello!
    //console.log(socket);
    onlineCount++;

    socket.on('join', (data) => {
        socket.join(data.roomid);

        //var rooms = socket.adapter.rooms;
        //console.log(rooms);



        //-------------------------------error : redis get 得到的值只能在function 內使用
        // redisClient.get(data.token, (err,res) => {
        //     console.log(res);
        //     var memberdata = JSON.parse(res);
        //     var retData={
        //         name: memberdata.Account,
        //         token: data.token,
        //         roomid: data.roomid,
        //     };
        // });
        
        socket['room']=data.roomid;
        console.log(retData);
        // console.log('roomid = '+ data.roomid);
        socket.broadcast.in(socket['room']).emit('message', {"event":'join', "data": retData});

        console.log('join');
    });

    socket.on('isOnline',(token) => {
        //-------------------------------error : redis get 得到的值只能在function 內使用
        redisClient.get(token,(error, res) => {
            //console.log(res);
            if(res != null)
            {
                var memberdata = JSON.parse(res);
                socket.emit('memberName',memberdata.Account);
            }
                //socket.emit('tokenStatus',res);
        });
        
        io.emit("online", onlineCount);
    });

    socket.on("greeeet", () => {
        io.emit("greeeet", onlineCount);
        console.log(onlineCount);
    });

    socket.on('disconnect', () => {
        // 有人離線了，扣人
        onlineCount = (onlineCount < 0) ? 0 : onlineCount-=1;
        io.emit("online", onlineCount);
    });
    
    // 修改 console.log 成 io.emit
    socket.on("send", (msg) => {
        // 廣播訊息到聊天室
        io.emit("msg", msg);
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
////get
    //var roomSet = {};
    // var roomid = 'roomA';
    // console.log(' join roomid: '+ roomid);
    
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
