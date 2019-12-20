var express = require('express');
var app = express();
var http = require('http').Server(app);
const io = require('socket.io')(http);
const PORT = process.env.PORT || 3000;
const path = require('path');//1211

var connectedUser = 0;
var usersData = [];

for (i = 0; i < 2; i++) {
    usersData[i] = {
        id: null,
        name: null,
        com: null
    };
}

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket) {
    usersData[(connectedUser++)%2].id = socket.id;
    console.log('connected', connectedUser, socket.id);
    //socket.on('chat', function(msg) {
    //    console.log(msg);
    //    io.emit('message', msg);
    //});
    socket.on('userName', function(name) {
        var t = getUserName(socket.id, name);
        if (t > -1) {
            console.log(usersData[t].name, socket.id);
        }
    });
    socket.on('command', function(command) {
        var num = userNumber(socket.id);
        usersData[num].com = command;
        console.log(command, usersData[num].name);
        if (commandCheck() == 1) {
            for (i = 0; i < 2; i++) {
                io.emit('log', makeMessage(usersData[i].id, usersData[i].com));
                usersData[i].com = null;
            } 
        }
    });
});

http.listen(PORT, function() {
    console.log('server listening. Port:' + PORT);
});

app.use(express.static(path.join(__dirname, 'css')));//1211

// ユーザIDとユーザ名の紐づけ
function getUserName(userId, userName) {
    var i;
    for (i = 0; i < 2; i++) {
        if (usersData[i].id == userId) {
            usersData[i].name = userName;
            //console.log(usersData[i].name, i);
            return i;
        }
    }
    return -1;    
}

// ユーザIDからユーザ番号を取得
function userNumber(userId) {
    var i;
    for (i = 0; i < 2; i++) {
        //console.log(usersData[i].id);
        if (usersData[i].id == userId) {
            return i;
        }
    }
    return -1;
}

// 2人のプレイヤーのコマンドが確定しているか
function commandCheck() {
    var i;
    for (i = 0; i < 2; i++) {
        if (usersData[i].com == null) {
            return -1;
        }
    }
    return 1;
}

// 名前とコマンドからメッセージを生成
function makeMessage(id, command) {
    var name = usersData[userNumber(id)].name;
    switch (command) {
        case 'attack':
            return name + 'の攻撃！';
        case 'defense':
            return name + 'は身を守っている…';
        case 'escape':
            return name + 'は逃げ出した！';
    }
}