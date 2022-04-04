var express = require('express');
const { json } = require('express/lib/response');
var query = require('../database.config');
var moment = require('moment');
var router = express.Router();


router.get('/', function (req, res, next) {
  console.log(req.body);
  // connection = mysql.createConnection(databaseConfig);
  // connection.connect();

  // connection.query('SELECT * FROM user_profile WHERE phone = ?',[req.body.phone], function (error, results, fields) {
  //   if (error) throw error;
  //   // console.log('The solution is: ', results);
  //   res.jsonp(results);
  // });
  // connection.end((error)=>{
  //     print(error);
  // });;
  // return;
});

router.get('/id', function (req, res) {
  console.log(req.body);
  res.json(req.body);
})



// 通过路由拦截获取的mobile参数，进行查询用户信息数据
router.post('/get', function (req, res) {
  console.log(req.body);
  let user_id = req.body.query_user_id ?? req.body.user_id;

  const sql = 'SELECT *,(SELECT COUNT(*) FROM focus_fans_list WHERE focus = ?) AS focus_length, (SELECT COUNT(*) FROM focus_fans_list WHERE befocus = ?) AS befocus_length  FROM user_profile WHERE user_id = ?';
  query(sql, [user_id, user_id, user_id], function (error, results, fields) {
    if (error) throw error;
    // console.log('The solution is: ', results);
    var backData = {
      "status": 0,
      "data": results
    }
    console.log(backData);
    res.json(backData);
  });

  return;
});


// 更新用户信息数据

router.post('/update', function (req, res) {
  console.log(req.body);

  const user_name = req.body.user_name;
  const user_img = req.body.user_img;
  const sex = req.body.sex;
  const college = req.body.college;
  const major = req.body.major;
  const user_id = req.body.user_id;

  query('UPDATE user_profile SET user_name=?, user_img=?, sex=?,college=?,major=? WHERE user_id =?', [user_name, user_img, sex, college, major, user_id], function (error, results, fields) {

    if (error) throw error;
    // console.log('The solution is: ', results);
    res.json({
      "msg": "修改成功",
      "data": results,
      "status": 0
    });
    console.log(results);
  })



  return;
})


// 获取用户学习时间

router.get('/getTime', function (req, res) {
  console.log(req.body);
  const phone = req.body.phone;

  query('SELECT user_id,phone,study_time,total_time FROM user_profile WHERE phone =?', [phone], function (error, results, fields) {

    if (error) throw error;
    // console.log('The solution is: ', results);
    res.json(results);
    console.log(results);
  })



  return;
})


// 上传数据
router.post('/updateTime', function (req, res) {
  // console.log(req.body);
  const user_id = req.body.user_id;
  const study_time = JSON.stringify(req.body.study_time);

  const total_time = req.body.total_time;

  console.log(study_time);

  connection.query('UPDATE user_profile SET study_time=?,total_time=?   WHERE user_id =?', [study_time, total_time, mobile], function (error, results, fields) {

    if (error) throw error;
    res.json(results);
    console.log(results);
  })



  return;
})


// 签到
router.post('/sign', function (req, res) {
  console.log(req.body);
  const datetime = req.body.datetime;
  const user_id = req.body.user_id;
  query('UPDATE user_profile SET last_sign = ? ,exp = exp + 100 WHERE user_id = ?', [datetime, user_id], function (error, results, fields) {
    if (error) throw error;

    res.json(results);
  })
})

// 获取排行榜

router.post('/rank', function (req, res) {
  console.log(req.body);
  query('SELECT total_time,user_id,user_name,user_img,college FROM user_profile ORDER BY total_time DESC LIMIT 0,10', [], function (error, results, fields) {
    if (error) throw error;
    res.json({ 'status': 0, 'data': results });
  })
})


// 获取关注用户相关信息
router.post('/getFocusOrBefocusList', function (req, res) {
  console.log(req.body);
  const user_id = req.body.user_id;
  const type = req.body.type;
  const sql =
    type == 0 ?
      'SELECT * FROM focus_fans_list a JOIN user_profile b WHERE a.befocus = b.user_id AND  a.focus = ?'
      : 'SELECT * FROM focus_fans_list a JOIN user_profile b WHERE a.focus = b.user_id AND  a.befocus = ?';
  query(sql, [user_id], function (error, results, fields) {
    if (error) throw error;
    console.log(results);
    res.json({
      'status': 0,
      'data': results
    })
  });

})

// 查询用户是否关注
router.post('/isFocus', function (req, res) {
  console.log(req.body);
  const user_id = req.body.user_id;
  const other_user_id = req.body.other_user_id;

  const sql = 'SELECT * FROM focus_fans_list WHERE focus =? AND befocus=?';
  query(sql, [user_id, other_user_id], function (error, results, fields) {
    if (error) throw error;
    console.log(results);
    res.json(results);
  })

})


// 关注用户
router.post('/focus', function (req, res) {
  console.log(req.body);
  const user_id = req.body.user_id;
  const other_user_id = req.body.other_user_id;

  const sql1 = 'SELECT * FROM focus_fans_list WHERE focus =? AND befocus=?';
  query(sql1, [user_id, other_user_id], function (error, results, fields) {
    if (error) throw error;

    console.log(results);
    let sql2;
    // 判断是取消关注 还是 关注
    if (results.length == 0) {
      sql2 = 'INSERT INTO focus_fans_list(focus,befocus) VALUES(?,?)';
    } else {
      sql2 = 'DELETE FROM focus_fans_list  WHERE focus =? AND befocus=?';
    }

    // 执行
    query(sql2, [user_id, other_user_id], function (error, results, fields) {
      if (error) throw error;
      console.log(results);
      res.json({ 'status': 0, 'data': results });
    })


  })

})





module.exports = router;
