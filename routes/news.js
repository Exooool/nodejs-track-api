var express = require('express');
var query = require('../database.config')
var router = express.Router();



// 获取
router.get('/', function (req, res) {
    console.log(req.body);
    query('SELECT * FROM news_list', function (error, results, fields) {
        if (error) throw error;
        // console.log('The solution is: ', results);
        res.jsonp(results);

    });
    return;
})


// 获取资讯从第几个开始的后面10个数据
router.post('/newslist', function (req, res) {
    let start = req.body.start;
    let hashtag = req.body.hashtag;

    if (start == null) {
        var errorBack = {
            "status": "bad",
            "msg": "参数错误"
        };
        res.json(errorBack);
    }
    else if (hashtag != null) {
        // 如果带标签
        // 联合评论表查询 评论个数
        var sql = 'SELECT news_id,news_content,content,news_time,hashtag,news_title,news_img,view_num,like_num, b.user_id, b.user_name,user_img,(SELECT COUNT(*) FROM news_comment c WHERE c.news_id = a.news_id) AS comment_num   FROM   news_list a JOIN user_profile b WHERE a.user_id = b.user_id AND a.hashtag =? ORDER BY a.like_num DESC  LIMIT ?,10;'

        query(sql, [hashtag, start], function (error, results, fields) {

            if (error) throw error;
            var dataBack = {
                "status": 0,
                "data": results
            };
            res.json(dataBack);

        });
    } else {
        // 如果不带标签
        var sql = 'SELECT news_id,news_content,content,news_time,hashtag,news_title,news_img,view_num,like_num, b.user_id, b.user_name,user_img,(SELECT COUNT(*) FROM news_comment c WHERE c.news_id = a.news_id) AS comment_num   FROM   news_list a JOIN user_profile b WHERE a.user_id = b.user_id  ORDER BY a.like_num DESC  LIMIT ?,10;'
        query(sql, [start], function (error, results, fields) {
            if (error) throw error;
            var dataBack = {
                "status": 0,
                "data": results
            };
            res.json(dataBack);

        });
    }

    return;
})


// 进入文章获取文章信息
router.post('/view', function (req, res) {
    console.log(req.body);
    var news_id = req.body.news_id;


    query('UPDATE news_list SET view_num =view_num+1 WHERE news_id=?', [news_id], function (error, results, fields) {
        if (error) throw error;
        console.log('文章' + news_id + 'like_num增加1');
        res.json({ 'status': 0 });
    })

    return;

})

// 获取指定用户发布的资讯信息
router.post('/getUserNews', function (req, res) {
    console.log('进入到/getUserNews路由:');
    console.log(req.body);
    let user_id = req.body.user_id;
    if (req.body.query_user_id != null) {
        user_id = req.body.query_user_id;
    }
    query('SELECT news_id,news_content,content,news_time,hashtag,news_title,news_img,view_num,like_num, b.user_id, b.user_name,user_img,(SELECT COUNT(*) FROM news_comment c WHERE c.news_id = a.news_id) AS comment_num   FROM   news_list a JOIN user_profile b WHERE a.user_id = b.user_id AND a.user_id = ?;', [user_id], function (error, results, fields) {
        if (error) throw error;
        var backData = {
            "status": 0,
            "data": results
        }
        res.json(backData);

    });

    return;
})

// 获取用户收藏的资讯
router.post('/getCollectNew', function (req, res) {
    console.log('进入到/getCollectNew:');
    const news_id = req.body.news_id;
    console.log(news_id);

    query('SELECT news_id,news_content,content,news_time,hashtag,news_title,news_img,view_num,like_num, b.user_id, b.user_name,user_img,(SELECT COUNT(*) FROM news_comment c WHERE c.news_id = a.news_id) AS comment_num   FROM   news_list a JOIN user_profile b WHERE a.user_id = b.user_id AND a.news_id IN (?);', [news_id], function (error, results, fields) {

        if (error) throw error;
        console.log(results);
        var backData = {
            "status": 0,
            "data": results
        }
        res.json(backData);

    });
    return;
})

// 资讯搜索功能

router.post('/search', function (req, res) {
    console.log('进入/search路由');
    console.log(req.body);
    const search = '%' + req.body.search + '%';
    var sql = 'SELECT news_id,news_content,content,news_time,hashtag,news_title,news_img,view_num,like_num, b.user_id, b.user_name,user_img,(SELECT COUNT(*) FROM news_comment c WHERE c.news_id = a.news_id) AS comment_num   FROM   news_list a JOIN user_profile b WHERE news_title like ? OR news_content like ? AND a.user_id = b.user_id;'

    query(sql, [search, search], function (error, results, fields) {
        if (error) throw error;
        console.log(results);
        var backData = {
            "status": 0,
            "data": results
        }
        res.json(backData);
    });

})


// 获取指定news_id的评论列表
router.post('/getComment', function (req, res) {
    console.log(req.body);
    const news_id = req.body.news_id;
    var sql = 'SELECT * FROM news_comment a JOIN user_profile b WHERE news_id = ? AND a.user_id = b.user_id;';
    query(sql, [news_id], function (error, results, fields) {
        if (error) throw error;
        console.log(results);
        var backData = {
            "status": 0,
            "data": results
        }
        res.json(backData);
    });
})

// 对指定news_id进行评论
router.post('/insertComment', function (req, res) {
    console.log(req.body);
    const news_id = req.body.news_id;
    const user_id = req.body.user_id;
    const content = req.body.content;
    var sql = 'INSERT INTO news_comment(news_id,user_id,content) VALUES(?,?,?);';
    query(sql, [news_id, user_id, content], function (error, results, fields) {
        if (error) throw error;
        console.log(results);
        var backData = {
            "status": 0,
            "data": results
        }
        res.json(backData);
    });
})

// 对文章点赞
router.post('/like', function (req, res) {
    console.log(req.body);
    const news_id = req.body.news_id;
    const user_id = req.body.user_id;
    const sql1 = 'SELECT like_num FROM news_list WHERE news_id =?';
    query(sql1, [news_id], function (error, results, fields) {
        if (error) throw error;
        console.log(results[0]);
        let like_list = JSON.parse(results[0]['like_num']);
        console.log(like_list);
        if (like_list.indexOf(user_id) >= 0) {
            res.json({ 'status': 1, 'msg': '点赞已经存在' });
        } else {
            like_list.push(user_id);
            console.log(JSON.stringify(like_list));
            const sql2 = 'UPDATE news_list SET like_num=? WHERE news_id =?'
            query(sql2, [JSON.stringify(like_list), news_id], function (error, results, fields) {
                if (error) throw error;
                res.json({ 'status': 0, 'msg': '修改成功' })
            });
        }

    })
    return;
})

// 对文章收藏
router.post('/star', function (req, res) {
    console.log(req.body);
    const news_id = req.body.news_id;
    const user_id = req.body.user_id;
    const sql1 = 'SELECT collection FROM user_profile WHERE user_id =?';
    query(sql1, [user_id], function (error, results, fields) {
        if (error) throw error;
        // console.log(results[0]);
        let collection = JSON.parse(results[0]['collection']);
        // console.log(collection);
        let pos = collection.indexOf(news_id);
        // console.log(pos);
        if (pos >= 0) {
            collection.splice(pos, 1);
            // console.log(collection);
            const sql2 = 'UPDATE user_profile SET collection=? WHERE user_id =?'
            query(sql2, [JSON.stringify(collection), user_id], function (error, results, fields) {
                if (error) throw error;
                res.json({ 'status': 1, 'msg': '取消收藏成功' });
            });

        } else {
            collection.push(news_id);
            // console.log(collection);
            // console.log(JSON.stringify(collection));
            const sql2 = 'UPDATE user_profile SET collection=? WHERE user_id =?'
            query(sql2, [JSON.stringify(collection), user_id], function (error, results, fields) {
                if (error) throw error;
                res.json({ 'status': 0, 'msg': '收藏成功' })
            });
        }

    })
    return;
})



module.exports = router;