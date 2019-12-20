var express = require('express');
var app = express();
var http = require('http').Server(app);
const io = require('socket.io')(http);
const PORT = process.env.PORT || 3000;
const path = require('path');//1211

var connectedUser = 0;
var usersData = [];
var messageBox = [];
var messageNum = 0;
var gameEnd = false;
var winner;

var status = {
    maxHP: 100
    /* 
        MP マジックポイント
        ATK 攻撃力
        STR 力
        VIT 生命力
        DEF 防御力
        INT 知力
        DEX 器用さ
        AGI 素早さ
        LUK 運
    */
};

for (i = 0; i < 2; i++) {
    usersData[i] = {
        id: null,
        name: null,
        com: null,
        HP: status.maxHP
    };
}

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.post('/result', function(req, res) {
    res.sendFile(__dirname + '/result.html');
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
            //for (i = 0; i < 2; i++) {
            //    io.emit('log', makeMessage(usersData[i].id, usersData[i].com));
            //    usersData[i].com = null;
            //}             

            for (i = 0; i < 2; i++) {
                if (gameEnd != true) {
                    addMessage(makeMessage(usersData[i].id));
                    for (j = 0; j < 2 && gameEnd == false; j++) {
                        if (usersData[i].HP <= 0) {
                            console.log(usersData[i].name + 'は力尽きた');
                            addMessage(usersData[i].name + 'は力尽きた');
                            addMessage(usersData[(i+1)%2].name + 'の勝利！');
                            winner = (i+1)%2;
                            gameEnd = true;
                        }
                    }
                }
                usersData[i].com = null;
            }
            sendLog(1000);    // 1秒間隔でメッセージを送信
            if (gameEnd == true) {
                io.emit('end', usersData[winner].name, usersData[(winner+1)%2].name);
            }

            //io.emit('log', makeMessage(usersData[0].id, usersData[0].com));
            //usersData[0].com = null;
            //sleep(1, function () {
            //    io.emit('log', makeMessage(usersData[1].id, usersData[1].com));
            //    usersData[1].com = null;
            //});
            //for (i = 0; i < 2; i++) {
            //    if (usersData[i].HP <= 0) {
            //        console.log(usersData[i].name + 'は力尽きた');
            //        io.emit('log', usersData[i].name + 'は力尽きた')
            //    }
            //}
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
function makeMessage(id) {
    var name = usersData[userNumber(id)].name;
    var command = usersData[userNumber(id)].com;
    switch (command) {
        case 'attack':
            attack(id);
            return name + 'の攻撃！';
        case 'defense':
            return name + 'は身を守っている…';
        case 'escape':
            return name + 'は逃げ出した！';
    }
}

function attack(id) {
    usersData[(userNumber(id) + 1) % 2].HP -= 20;
}

// waitSec秒待ってからcallback関数を呼び出し
function sleep(waitSec, callbackFunc) {
    var spanedSec = 0;
    var id = setInterval(function () {
        spanedSec += 0.1;
        if (spanedSec >= waitSec) {
            clearInterval(id);
            if (callbackFunc) {
                callbackFunc();
            }
        }
    }, 100);
}

// メッセージを格納
function addMessage(msg) {
    messageBox[messageNum++] = msg;
}

// メッセージを一定の時間間隔で送信
function sendLog(interval) {
    var count = 0;
    var intervalId = setInterval(function () {
        if (count >= messageNum) {
            messageNum = 0;
            clearInterval(intervalId);
        } else {
            io.emit('log', messageBox[count]);
            messageBox[count++] = null;
        }
    }, interval);
}
