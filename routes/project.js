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
    // 时间以键值对存储
    const study_time = '{}';
    const sql1 = 'INSERT INTO project_list(user_id,project_title,project_img,stage_list,end_time,single_time,frequency,remainder_time,secret,study_time) VALUES(?,?,?,?,?,?,?,?,?,?)';
    query(sql1, [user_id, project_title, project_img, stage_list, end_time, single_time, frequency, remainder_time, secret, study_time], function (error, results, fields) {
        if (error) throw error;

        const sql2 = 'SELECT MAX(project_id) project_id FROM project_list WHERE user_id = ?';
        query(sql2, [user_id], function (error, results, fields) {
            if (error) throw error;
            console.log(results);
            res.json({
                "status": 0,
                "data": { 'project_id': results[0].project_id }
            });
        })

    })
});

// 删除计划 如果有互助小组连着互助小组一起删除
router.post('/remove', function (req, res, next) {
    const project_id = req.body.project_id;
    const group_id = req.body.group_id;
    console.log(req.body);

    query('DELETE FROM project_list WHERE project_id = ?', [project_id], function (error, results, fields) {
        if (error) throw error;

        // 如果有加入互助小组 判断是否还剩人 否 删除互助小组
        if (group_id != null) {
            console.log('有互助小组')
            query('SELECT COUNT(group_id) member_length FROM group_member WHERE group_id = ?', [group_id], function (error, results, fields) {
                if (error) throw error;
                console.log(results);
                // 只剩0个人时
                if (results[0].member_length == 0) {
                    console.log('只剩一个人');
                    query('DELETE FROM group_list WHERE group_id = ?', [group_id], function (error, results, fields) {
                        if (error) throw error;
                        res.json({
                            "status": 0,
                            "data": results
                        });
                    })
                }else{
                    res.json({
                        "status": 0,
                        "data": results
                    });
                }
            })
        } else {
            res.json({
                "status": 0,
                "data": results
            });
        }

    })
});


router.post('/update', function (req, res, next) {
    res.render('index', { title: 'Express' });
});


// 创建小组
router.post('/group/create', function (req, res) {
    console.log(req.body);
    const user_id = req.body.user_id;
    const project_id = req.body.project_id;
    const frequency = req.body.frequency;
    const sql1 = 'INSERT INTO group_list(create_user,frequency) VALUES(?,?)';
    query(sql1, [user_id, frequency], function (error, results, fields) {
        if (error) throw error;

        const sql2 = 'SELECT MAX(group_id) as group_id FROM group_list WHERE create_user = ? ORDER BY create_time DESC';
        query(sql2, [user_id], function (error, results, fields) {
            if (error) throw error;

            const group_id = results[0].group_id;
            console.log(group_id);
            // 插入project_list 中的group_id
            let p1 = new Promise(function (resolve, reject) {
                const sql4 = 'UPDATE project_list SET group_id = ? WHERE project_id = ?';
                query(sql4, [group_id, project_id], function (error, results, fields) {
                    if (error) reject(error);
                    resolve(results);
                })
            })

            // 插入group_member表
            let p2 = new Promise(function (resolve, reject) {
                const sql3 = 'INSERT INTO group_member(group_id,user_id,project_id) VALUES(?,?,?)';
                query(sql3, [group_id, user_id, project_id], function (error, results, fields) {
                    if (error) reject(error);
                    resolve(results);
                })
            })

            Promise.all([p1, p2]).then(function (values) {
                console.log(values);
                res.json({ 'status': 0, 'data': { 'group_id': group_id }, 'msg': '小组创建成功' });
            }, function (error) {
                console.log(error);
                res.json({ 'status': 1, 'msg': '创建小组异常' });
            });


        })

    })

})


// 匹配小组
router.post('/group/add', function (req, res) {
    console.log(req.body);
    const user_id = req.body.user_id;
    const project_id = req.body.project_id;
    const frequency = req.body.frequency;
    const sql1 = 'SELECT MIN(c.group_id) group_id FROM (SELECT COUNT(a.group_id)  group_length,a.group_id FROM group_list a JOIN (SELECT * FROM group_member WHERE group_id NOT IN(SELECT group_id FROM group_member WHERE user_id = ?)) b  WHERE a.frequency = ? AND a.group_id = b.group_id GROUP BY a.group_id) c WHERE c.group_length < 3 ';
    query(sql1, [user_id, frequency], function (error, results, fields) {
        if (error) throw error;

        console.log(results);
        if (results[0].group_id != null) {

            const group_id = results[0].group_id;
            // 插入project_list 中的group_id
            let p1 = new Promise(function (resolve, reject) {
                const sql4 = 'UPDATE project_list SET group_id = ? WHERE project_id = ?';
                query(sql4, [group_id, project_id], function (error, results, fields) {
                    if (error) reject(error);
                    resolve(results);
                })
            })

            // 插入group_member表
            let p2 = new Promise(function (resolve, reject) {
                const sql3 = 'INSERT INTO group_member(group_id,user_id,project_id) VALUES(?,?,?)';
                query(sql3, [group_id, user_id, project_id], function (error, results, fields) {
                    if (error) reject(error);
                    resolve(results);
                })
            })

            Promise.all([p1, p2]).then(function (values) {
                console.log(values);
                res.json({ 'status': 0, 'data': { 'group_id': group_id }, 'msg': '加入小组成功' });
            }, function (error) {
                console.log(error);
                res.json({ 'status': 1, 'msg': '加入小组异常' });
            });
        } else {
            res.json({
                'status': 2,
                'msg': '没有能够匹配的小组'
            })
        }

    })

})

// 获取加入的互助小组信息
router.get('/group/get', function (req, res) {
    console.log(req.body);
    const user_id = req.body.user_id;
    const sql = 'SELECT f.group_id,f.user_id ,f.project_id, f.user_img, f.user_name, g.project_title,g.frequency FROM (SELECT c.group_id,c.user_id ,c.project_id, d.user_img, d.user_name FROM group_member c JOIN user_profile d JOIN (SELECT a.group_id FROM group_member a JOIN group_list b WHERE  a.user_id = ? AND a.group_id = b.group_id) e WHERE c.group_id = e.group_id AND c.user_id =d.user_id) f JOIN project_list g WHERE f.project_id = g.project_id';
    query(sql, [user_id], function (error, results, fields) {
        if (error) throw error;
        res.json({
            'status': 0,
            'data': results
        })
    })

})

// 退出互助小组
router.post('/group/remove', function (req, res) {
    console.log(req.body);
    const user_id = req.body.user_id;
    const group_id = req.body.group_id;
    query('DELETE FROM group_member WHERE group_id = ? AND user_id =? ', [group_id, user_id], function (error, results, fields) {
        if (error) throw error;

        // 如果有加入互助小组 判断是否还剩人 否 删除互助小组
        if (group_id != null) {
            console.log('有互助小组')
            query('SELECT COUNT(group_id) member_length FROM group_member WHERE group_id = ?', [group_id], function (error, results, fields) {
                if (error) throw error;
                console.log(results);
                // 只剩0个人时
                if (results[0].member_length == 0) {
                    console.log('只剩一个人');
                    query('DELETE FROM group_list WHERE group_id = ?', [group_id], function (error, results, fields) {
                        if (error) throw error;
                        res.json({
                            "status": 0,
                            "data": results
                        });
                    })
                }
            })
        } else {
            res.json({
                "status": 0,
                "data": results
            });
        }
    })
})

// 获取互助小组成员信息
router.post('/group/getById', function (req, res) {
    console.log(req.body);
    const group_id = req.body.group_id;
    const user_id = req.body.user_id;
    const sql = 'SELECT * FROM project_list a JOIN user_profile b WHERE a.user_id = b.user_id AND a.group_id = ? AND a.user_id != ? ';
    query(sql, [group_id, user_id], function (error, results, fields) {
        if (error) throw error;
        // 返回刚刚创建的group_id
        res.json({
            "status": 0,
            "data": results
        });
    })

})


// 上传学习数据
router.post('/study', function (req, res) {
    console.log(req.body);
    const project_id = req.body.project_id;
    const user_id = req.body.user_id;
    const study_time = req.body.study_time;
    const now_time = req.body.now_time;

    let p1 = new Promise(function (resolve, reject) {
        const sql1 = 'SELECT study_time FROM project_list WHERE project_id = ? ';
        query(sql1, [project_id], function (error, results, fields) {
            if (error) reject(error);

            // 将从数据库取出的值转为object
            let timeMap = JSON.parse(results[0].study_time);
            console.log(JSON.parse(results[0].study_time));
            // 判断当前时间是否在object中
            timeMap[now_time] = (now_time in timeMap) ? timeMap[now_time] + study_time : study_time;
            console.log(timeMap);

            const sql2 = 'UPDATE project_list SET study_time = ? WHERE project_id = ? ';
            query(sql2, [JSON.stringify(timeMap), project_id], function (error, results, fields) {
                if (error) reject(error);
                // console.log(results.affectedRows);

                // 判断影响行数 看是否修改成功
                if (results.affectedRows == 1) {
                    resolve(results.affectedRows);
                } else {
                    reject('project_list study_time 影响行数不为1');
                }

            })



        })
    })

    let p2 = new Promise(function (resolve, reject) {
        const sql1 = 'SELECT study_time FROM user_profile WHERE user_id = ? ';
        query(sql1, [user_id], function (error, results, fields) {
            if (error) reject(error);
            // 将从数据库取出的值转为object
            let timeMap = JSON.parse(results[0].study_time);
            console.log(JSON.parse(results[0].study_time));
            // 判断当前时间是否在object中
            timeMap[now_time] = (now_time in timeMap) ? timeMap[now_time] + study_time : study_time;

            console.log(timeMap);

            const sql2 = 'UPDATE user_profile SET study_time = ? WHERE user_id = ? ';
            query(sql2, [JSON.stringify(timeMap), user_id], function (error, results, fields) {
                if (error) reject(error);

                if (results.affectedRows == 1) {
                    resolve(results.affectedRows);
                } else {
                    reject('user_profile study_time 影响行数不为1');
                }
            })


        })
    })

    let p3 = new Promise(function (resolve, reject) {
        const sql = 'UPDATE user_profile SET total_time = total_time + ? WHERE user_id = ? ';
        query(sql, [study_time, user_id], function (error, results, fields) {
            if (error) reject(error);
            console.log(results);
            if (results.affectedRows == 1) {
                resolve(results.affectedRows);
            } else {
                reject('user_profile total_time 影响行数不为1');
            }
        })
    })

    Promise.all([p1, p2, p3]).then(function (values) {
        console.log(values);
        res.json({ 'status': 0, 'msg': '上传成功' });
    }, function (error) {
        console.log(error);
        res.json({ 'status': 1, 'msg': '数据上传异常' });
    });

})


module.exports = router;