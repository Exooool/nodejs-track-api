var express = require('express');
var router = express.Router();
const { Server } = require("socket.io");
var query = require('../database.config')

const io = new Server(3001, { cors: true/*允许跨域 */ },);

// 在线列表
var onlineList = {};
// onlineName是来维护用户socket触发disconnect事件时，用来移除id的
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
  socket.on('message', function (chart_list, newMessage, to, id) {
    const from = newMessage['user_id'];
    const message = newMessage['content']

    console.log(socket.id);
    console.log(onlineList);

    console.log(from + '发出信息：' + message + ',到：' + to + ',聊天id为：' + id);
    console.log(chart_list);
    const sql = 'UPDATE chart_list SET chart_data = ? WHERE chart_id = ?';
    query(sql, [JSON.stringify(chart_list), id], function (error, results, fields) {
      if (error) throw error;
      console.log('影响行数：' + results.affectedRows);
    })

    // 如果to的id存在就发送广播
    if (onlineList[to]) {
      io.emit('message', newMessage, to, id);
    }

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



// 获取聊天列表
router.post('/getChartList', function (req, res) {
  console.log(req.body)
  const user_id = req.body.user_id;
  const sql = 'SELECT chart_id,chart_data,user_id,user_img,user_name FROM (SELECT * FROM  (SELECT  * FROM  chart_list  WHERE ? IN(user_one,user_two)) a JOIN user_profile b WHERE   a.user_one = b.user_id OR  a.user_two = b.user_id ) c WHERE c.user_id !=?';
  query(sql, [user_id, user_id], function (error, results, fields) {
    if (error) throw error;

    res.json({ 'status': 0, 'data': results })
  })

})

// 创建聊天记录
router.post('/create', function (req, res) {
  console.log(req.body)
  const user_id = req.body.user_id;
  const other_user_id = req.body.other_user_id;
  const chart_data = '[]';

  // 查询是否存在聊天 存在就不创建

  const sql1 = 'SELECT * FROM chart_list WHERE ? IN (user_one,user_two) AND ? IN (user_one,user_two)';
  query(sql1, [user_id, other_user_id], function (error, results, fields) {
    if (error) throw error;
    console.log('查找长度为：' + results.length);
    if (results.length == 0) {
      const sql2 = 'INSERT INTO chart_list(user_one,user_two,chart_data) VALUES(?,?,?)';
      query(sql2, [user_id, other_user_id, chart_data], function (error, results, fields) {
        if (error) throw error;
        console.log(results);
        res.json({ 'status': 0, 'data': results })
      })
    }else{
      res.json({ 'status': 0, 'data': results })
    }
    

  })


})

router.get('/getOnlineList',function(req,res){
  res.json(onlineList);
})

module.exports = router;