var express = require('express');
var crypto = require('crypto');
var User = require('../models/user.js');
var Post = require('../models/post.js');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', {
      title: '主页',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString(),
  });
});
//reg
router.get('/reg',checkNotLogin);
router.get('/reg',function(req,res){
  res.render('reg',{
      title: '注册',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
  });
});
router.post('/reg',checkNotLogin);
router.post('/reg',function(req,res){
  var name = req.body.name,
      password = req.body.password,
      password_re = req.body['password-repeat'];
  //检测用户两次输入密码是否一致
  if(password_re != password){
    req.flash('error','两次输入密码不一致');
    return res.redirect('/reg');
  }
  //生成密码的md5值
  var md5 = crypto.createHash('md5'),
      password = md5.update(req.body.password).digest('hex');
  //创建User对象
  var newUser = new User({
    name: name,
    password: password,
    email: req.body.email
  });
  //检查用户名是否已存在
  User.get(newUser.name,function(err,user){
    if(user){
      req.flash('error','用户已存在');
      return res.redirect('/reg');
    }
    //不存在则新增用户
    newUser.save(function(err,user){
      if(err){
        req.flash('error',err);
        return res.redirect('/reg');
      }
      req.session.user = user;//用户信息存入session
      req.flash('success','注册成功');
      res.redirect('/');
    });
  });
});
//login
router.get('/login',checkNotLogin);
router.get('/login',function(req,res){
  res.render('login',{
      title: '登录',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
  })
});
router.post('/login',checkNotLogin);
router.post('/login',function(req,res){
    var md5 = crypto.createHash('md5'),
        password = md5.update(req.body.password).digest('hex');
    //检查用户是否存在
    User.get(req.body.name,function(err,user){
        if(!user){
            req.flash('error','用户不存在');
            return res.redirect('/login');
        }
        //检查密码是否一致
        if(user.password != password){
            req.flash('error','密码错误');
            return res.redirect('/login');
        }
        //都匹配，将用户信息存入session
        req.session.user = user;
        req.flash('success','登录成功');
        res.redirect('/');
    })
});
//post
router.get('/post',checkLogin);
router.get('/post',function(req,res){
  res.render('post',{
      title: '发表',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
  })
});
router.post('/post',checkLogin);
router.post('/post',function(req,res){
    var currentUser = req.session.user,
        post = new Post(currentUser.name,req.body.title,req.body.post);
    post.save(function(err){

    });
});
//logout
router.get('/logout',checkLogin);
router.get('/logout',function(req,res){
    req.session.user = null;
    req.flash('success','登出成功');
    res.redirect('/')
});

function checkNotLogin(req,res,next){
    if(req.session.user){
        req.flash('error','已登录');
        res.redirect('back');//退回之前的页面
    }
    next();
}
function checkLogin(req,res,next){
    if(!req.session.user){
        req.flash('error','未登录');
        res.redirect('/login');
    }
    next();
}




module.exports = router;
