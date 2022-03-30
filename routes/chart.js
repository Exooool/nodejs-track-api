var express = require('express');
var router = express.Router();
const { Server } = require("socket.io");
var query = require('../database.config')

const io = new Server(3001, { cors: true/*允许跨域 */ },);

// 在线列表
var onlineList = {};
var onlineName = {}

io.on('connection', (socket) => {
  console.log('a user connected socket network');


  socket.on('join', function (name) {
    onlineList[name] = socket.id;
    onlineName[socket.id] = name;
    console.log(name + "进入了聊天网络");
    console.log(onlineList);
    console.log(onlineName);
  })



  // 发送聊天
  socket.on('message', function (message) {
    // const sql = '';
    // query(sql,[], function (error, results, fields){

    // })
    io.emit('message',message);
    
    // console.log();
  })

  // 断开连接
  socket.on('disconnect', function (event) {

    if (onlineName[socket.id]) {
      let name = onlineName[socket.id]
      delete onlineName[socket.id];
      delete onlineList[name];
      console.log(name + '离开了聊天网络');
      console.log(onlineList);
      console.log(onlineName);
    }
  });


  socket.on('close', function (name) {

    console.log('user close');
  });
});



module.exports = router;