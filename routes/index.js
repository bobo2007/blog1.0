var express = require('express');
var crypto = require('crypto');
var User = require('../models/user.js');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', {
    title: '主页'
  });
});
//reg
router.get('/reg',function(req,res){
  res.render('reg',{
    title: '注册'
  });
});
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
router.get('/login',function(req,res){
  res.render('login',{
    title: '登录'
  })
});
router.post('/login',function(req,res){

});
//post
router.get('/post',function(req,res){
  res.render('post',{
    title: '发表'
  })
});
router.post('/post',function(req,res){

});
//logout
router.get('/logout',function(req,res){

});


module.exports = router;
