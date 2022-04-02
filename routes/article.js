var express = require('express');
var multer = require('multer');
var fs = require('fs');
var query = require('../database.config')
var path = require('path');

var router = express.Router();

var uploader = multer({ dest: path.join(path.dirname(__dirname), 'public', 'images') })

/* GET users listing. */
router.get('/', function (req, res, next) {
    res.send('respond with a resource');
});

// __dirname总是指向执行js所在的绝对地址
// 上传单张文章图片
router.post('/imgPost', uploader.single('image'), function (req, res) {
    // 获取文件信息
    const file = req.file;
    //获取后缀名
    const extname = path.extname(file.originalname);
    //获取上传成功之后的文件路径
    const filepath = file.path;
    //上传之后文件的名称
    const filename = filepath + extname;
    console.log(filename);
    // console.log(req.file); //获取图片  files获取多张图片
    // console.log(req.body); //获取其他参数
    fs.rename(filepath, filename, (err) => {
        if (err) throw err;
        console.log("rename compelter path:");
    })

    return res.send(file.filename + extname);
})

// 上传多张图片

// router.post('/multiImgPost', function (req, res) {

// })


// 上传文章
router.post('/postArticle', function (req, res) {
    console.log(req.body);
    const user_id = req.body.user_id;
    const news_content = req.body.news_content;
    const hashtag = req.body.hashtag;
    const news_title = req.body.news_title;
    const news_img = req.body.news_img;
    const content = req.body.content;
    const like_num = '[]';


    query('INSERT INTO news_list(user_id,news_content,hashtag,news_title,news_img,content,like_num)  VALUES(?,?,?,?,?,?,?)', [user_id,news_content,hashtag,news_title,news_img,content,like_num], function (error, results, fields) {
        if (error) throw error;

        if(results['affectedRows']!=0){
            res.json({'status':0,'msg':'数据添加成功'});
        }
        

    });


});

module.exports = router;