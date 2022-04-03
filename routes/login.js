var express = require('express');
var request = require('request');
var jwt = require('jsonwebtoken');
var NodeRSA = require('node-rsa');
var https = require('https');
var query = require('../database.config')
var router = express.Router();

// 这是加密的key（密钥）
var secretOrPrivateKey = "I am a goog man!"


// rsa私钥进行解密
var privateKey =
    '-----BEGIN PRIVATE KEY-----' +
    'MIICdgIBADANBgkqhkiG9w0BAQEFAASCAmAwggJcAgEAAoGBANDXx1zZ0VfqITzQ' +
    'aBOZe80NWmtdbNNbIG8YpDBLQZ/FkQW2ncEfPQwcwihRGceGIKDGfyT8tl97IFhi' +
    'Nbjtyf7N2lzVK1dVBzjFLKVJSvvsC8ISJiHVEMbvq6E/TILk0argA7ucmvlLI77G' +
    'mXk+8OlbaSHYpcnJ6egXXbuOtZapAgMBAAECgYAsGmVvplAfUMJUJW7VNMSAOSGv' +
    'Krugps3iqEGEMWBabU6C9l26Ou6ZcDlQalAXYqvhSAnxtayN3WKnR5Ywx4awdtRw' +
    'dg8InQQMDvy2J/kdH8WcbWkVyLZVBqDuJcrt429/1o6FEpoNs0r3n6ATMJlJF//G' +
    'r/XNzcDsSCDsyU31AQJBAPU0cAF55B1PwJpo6mMyXjnGsoaek3qaA73NO1vamyvb' +
    'wQA+LWOXHyJw1y7cx8k4iJht+guKl/yJcpcfqpUjWJUCQQDaCYbTHFBeQJ/Ey1Rp' +
    'g1xsFACxA4BpCZjt/DNzs9WzFv/1aB1xjvHiZcE4AGofXe7LshRF65ZcWJQc2ojx' +
    'YbzFAkBZ2u1wnQpK837RFsFNuJdu9LFXQ6UnuGjGlP67mlBishT30dEwPaDbLh6s' +
    'vZs40c68jRCkShWIJZYoayJHpLxBAkEAkK2noCf2kEQzf+Mn9QesaS7wsoTPTWOH' +
    '7cre3VSkZbzKRS4782FV0dORXbawtHWhAdr9ptPHpylDxs2f9wPSvQJAESL+qJ48' +
    'NHoKSkM1zNDlB6CeS54XYPWOX63aC4ect5055e75KLf1Kxld5vXeadrS3NYm3BRk' +
    'DCL+D7c4Ewu3pQ==' +
    '-----END PRIVATE KEY-----';

//解密方法 
function decryptByPrivateKey(data) {
    const key = new NodeRSA(privateKey);
    key.setOptions({ encryptionScheme: 'pkcs1' })
    let _data = key.decrypt(data, 'utf8');
    console.error("-----encryptMsg By PublicKey: ", _data)
    return _data;
}




// 测试用
router.post('/', function (req, res) {
    // console.log(req.headers.authorization);
    console.log(req.body);
    res.json(decryptByPrivateKey(req.body.loginToken));
})


// 通过短信验证
router.post('/messageVerify', function (req, res) {
    console.log(req.body)
    var mobile = req.body.mobile;
    var msg_id = req.body.msg_id;
    var code = req.body.code;

    var options = {
        url: 'https://api.sms.jpush.cn/v1/codes/' + msg_id + '/valid',
        method: "POST",
        headers: {
            "content-type": "application/json",
            "Authorization": "Basic N2M1MTJkYTY0NjQ0NmNjNjlmOWM1NWE1Ojg4NTI2OWE1NDNlZmVjZTdlMTQ1OGZjZQ=="
        },
        body: JSON.stringify({
            "code": code
        })
    };

    // 通过极光提供的api接口验证
    request(options, function (error, response, body) {

        let data = JSON.parse(body)

        console.log(body);

        // if (!error && response.statusCode == 200) {
        //     console.log(body) // Show the HTML for the baidu homepage.
        // }
        // 如果验证通过了就返回token并查询数据库是不是第一次登录
        if (data.is_valid) {

            // 查询数据库

            function UserQuery(callback) {
                query('SELECT * FROM user_profile WHERE  mobile =?', [mobile], function (error, results, fields) {
                    if (error) throw error;
                    // console.log('The solution is: ', results);
                    let first = true;
                    if (results.length != 0) {
                        console.log('not')
                        first = false;
                    }
                    console.log(first);
                    let backData = {
                        "is_valid": true,
                        "token": getToken(mobile),
                        "first": first
                    }

                    // 传回first进行判断
                    callback(first);

                    console.log(backData);
                    res.json(backData);
                });
            }

            UserQuery(function (first) {
                if (first) {
                    // 插入新用户数据
                    var sql = 'INSERT INTO user_profile(mobile,password,user_img,sex,user_name,college,major,mail,study_time,collection) VALUES(?,?,?,?,?,?,?,?,?,?)'
                    query(sql, [mobile, '0000000000', '', '保密', '轨迹用户', '无', '无', '无','{}','[]'], function (error, results, fields) {
                        if (error) throw error;
                        console.log('插入成功');
                    });
                }
            })

            return;
        } else {
            res.json(data);
            console.log(data);
            return;
        }

    })


    // res.json(getToken(phone));
})


// 使用极光认证一键登录
router.post('/loginTokenVerify', function (req, res) {
    console.log(req.body);
    const loginToken = req.body.loginToken;
    let options = {
        url: 'https://api.verification.jpush.cn/v1/web/loginTokenVerify',
        method: "POST",
        headers: {
            "content-type": "application/json",
            "Authorization": "Basic N2M1MTJkYTY0NjQ0NmNjNjlmOWM1NWE1Ojg4NTI2OWE1NDNlZmVjZTdlMTQ1OGZjZQ=="
        },
        body: JSON.stringify({
            "loginToken": loginToken
        })
    };
    request(options, function (error, response, body) {
        let data = JSON.parse(body)
        console.log(data);
        // 8000为成功验证token的代码
        if (data.code == 8000) {
            console.log(data.phone);
            const phone = data.phone;

            // 解析后的手机号
            const mobile =  decryptByPrivateKey(phone);
            console.log(mobile);
            // 将获取到的rsa加密的手机号 进行界面得到mobile

            // 判断该用户是不是新用户
            // query('SELECT * FROM user_profile WHERE user_id = ?',[mobile],function (error, results, fields){

            // })

            function UserQuery(callback) {
                query('SELECT * FROM user_profile WHERE  mobile =?', [mobile], function (error, results, fields) {
                    if (error) throw error;
                    // console.log('The solution is: ', results);
                    let first = true;
                    if (results.length != 0) {
                        console.log('not')
                        first = false;
                    }
                    console.log(first);
                    let backData = {
                        "is_valid": true,
                        "token": getToken(mobile),
                        "first": first
                    }

                    // 传回first进行判断
                    callback(first);

                    console.log(backData);
                    res.json(backData);
                });
            }

            UserQuery(function (first) {
                if (first) {
                    // 插入新用户数据
                    var sql = 'INSERT INTO user_profile(mobile,password,user_img,sex,user_name,college,major,mail,study_time,collection) VALUES(?,?,?,?,?,?,?,?,?,?)'
                    query(sql, [mobile, '0000000000', '', '保密', '轨迹用户', '无', '无', '无','{}','[]'], function (error, results, fields) {
                        if (error) throw error;
                        console.log('插入成功');
                    });
                }
            })

            return;

        } else {
            res.json({
                'status': 1,
                'msg': '一键登录失败'
            })
        }
    })

})




// 获取token
function getToken(mobile) {
    let content = { msg: "track", mobile: mobile }; // 要生成token的主题信息
    console.log(content);
    let token = jwt.sign(content, secretOrPrivateKey, {
        expiresIn: 60 * 60 * 2400  // 2400小时过期
    });
    console.log("token ：" + token);
    return token;
};


module.exports = router;