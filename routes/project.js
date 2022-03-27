var express = require('express');
var router = express.Router();

var query = require('../database.config')




// 获取该用户的计划列表
router.post('/get', function (req, res) {
    console.log(req.body);
    let user_id = req.body.user_id;
    if (req.body.query_user_id != null) {
        user_id = req.body.query_user_id;
    }
    query('SELECT * FROM project_list WHERE user_id=?', [user_id], function (error, results, fields) {
        if (error) throw error;
        res.json({
            "status": 0,
            "data": results
        });
        console.log(results)
    });


})

// 添加计划
router.post('/add', function (req, res, next) {
    console.log(req.body);
    const user_id = req.body.user_id;
    const project_title = req.body.project_title;
    const project_img = req.body.project_img;
    const stage_list = req.body.stage_list;
    const end_time = req.body.end_time;
    const single_time = req.body.single_time;
    const frequency = req.body.frequency;
    const remainder_time = req.body.remainder_time;
    const secret = 'false';
    const study_time = '[]';
    const sql = 'INSERT INTO project_list(user_id,project_title,project_img,stage_list,end_time,single_time,frequency,remainder_time,secret,study_time) VALUES(?,?,?,?,?,?,?,?,?,?)';
    query(sql, [user_id, project_title, project_img, stage_list, end_time, single_time, frequency, remainder_time, secret, study_time], function (error, results, fields) {
        if (error) throw error;

        res.json({
            "status": 0,
            "data": results
        });
    })
});

// 删除计划
router.post('/remove', function (req, res, next) {
    const project_id = req.body.project_id;

    query('DELETE FROM project_list WHERE project_id = ?', [project_id], function (error, results, fields) {
        if (error) throw error;

        res.json({
            "status": 0,
            "data": results
        });
    })
});


router.post('/update', function (req, res, next) {
    res.render('index', { title: 'Express' });
});




module.exports = router;