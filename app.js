var createError = require('http-errors');
var express = require('express');
var path = require('path');
var jwt = require('jsonwebtoken');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var loginRouter = require('./routes/login');
var usersRouter = require('./routes/users');
var newsRouter = require('./routes/news');
var articleRouter = require('./routes/article');
var chartRouter = require('./routes/chart');
var projectRouter = require('./routes/project');
const { json } = require('express/lib/response');
// 数据库文件
var query = require('./database.config')
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use('/login', loginRouter);

var secretOrPrivateKey = "I am a goog man!"
// 设置路由拦截
app.use(function (req, res, next) {
  // token校验 防止过期
  if (!checkToken(req.headers.authorization)) {
    var error = {
      "status": 2,
      "msg": "token异常，过期或不存在"
    }
    return res.json(error);
  }
  console.log('token解析结果如下：');
  console.log(jwt.verify(req.headers.authorization, secretOrPrivateKey));
  // 将解析的电话号码通过body传递
  const mobile = jwt.verify(req.headers.authorization, secretOrPrivateKey).mobile;

  req.body.mobile = mobile;

  query('SELECT user_id FROM user_profile WHERE mobile=?', [mobile], function (error, results, fields) {
    if (error) throw error;
    // console.log(results[0]['user_id']);
    req.body.user_id = results[0]['user_id'];
    
    
    next();
  })

  
})

// token检验方法
function checkToken(token) {
  try {
    return jwt.verify(token, secretOrPrivateKey); // 如果过期将返回false
  } catch (e) {
    console.error('jwt verify error --->', e);
    return false;
  }
};

app.use('/', indexRouter);

app.use('/users', usersRouter);
app.use('/news', newsRouter);
app.use('/article', articleRouter);
app.use('/chart', chartRouter);
app.use('/project',projectRouter);


// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});





module.exports = app;
