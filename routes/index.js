var express = require('express');
var crypto = require('crypto');
var Post = require('../models/post.js');
var User = require('../models/user.js');
var Comment = require('../models/comment.js');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
    //设置query为null以获取全部文章
    Post.getAll(null,function(err,posts){
        if(err){
            posts = [];
        }
        res.render('index', {
            title: '主页',//页面名称
            user: req.session.user, //session data
            posts: posts,   //文章集合
            success: req.flash('success').toString(),//操作成功推送消息
            error: req.flash('error').toString()//操作失败推送消息
        });
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
        if(err){
            req.flash('error',err);
            return res.redirect('/');
        }
        req.flash('success','发表成功');
        res.redirect('/');
    });
});
//logout
router.get('/logout',checkLogin);
router.get('/logout',function(req,res){
    req.session.user = null;
    req.flash('success','登出成功');
    res.redirect('/')
});
//upload
router.get('/upload',checkLogin);
router.get('/upload',function(req,res){
    res.render('upload',{
        title: '文件上传',
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
    });
});
router.post('/upload',checkLogin);
router.post('/upload',function(req,res){
    req.flash('success','上传成功');
    res.redirect('/');
});
//user
router.get('/user/:name',function(req,res){
    //检查用户是否存在
    User.get(req.params.name,function(err,user){
        if(!user){
            req.flash('error','用户不存在！');
            return res.redirect('/');
        }
        //查询并返回该用户的所有文章
        Post.getAll(user.name,function(err,posts){
            if(err){
                req.flash('error',err);
                return res.redirect('/');
            }
            res.render('user',{
                title: user.name,
                posts: posts,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });
});
//文章页面
router.get('/user/:name/:day/:title',function(req,res){
    Post.getOne(req.params.name,req.params.day,req.params.title,function(err,post){
        if(err){
            req.flash('error',err);
            return res.redirect('/');
        }
        res.render('article',{
            title: req.params.title,//页面名称
            post: post,
            user: req.session.user,//session data
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        })
    })
});
//编辑页面
router.get('/edit/:name/:day/:title',checkLogin);
router.get('/edit/:name/:day/:title',function(req,res){
    var currentUser = req.session.user;//只能编辑已登录用户的文章
    Post.edit(currentUser.name,req.params.day,req.params.title,function(err,post){
        if(err){
            req.flash('error',err);
            return res.redirect('back');
        }
        res.render('edit',{
            title: '编辑',
            post: post,
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
});
router.post('/edit/:name/:day/:title',checkLogin);
router.post('/edit/:name/:day/:title',function(req,res){
    var currentUser = req.session.user;
    Post.update(currentUser.name,req.params.day,req.params.title,req.body.post,function(err){
        var url =encodeURI('/user/'+currentUser.name+'/'+req.params.day+'/'+req.params.title);
        if(err){
            req.flash('error',err);
            return res.redirect(url);//返回文章页
        }
        req.flash('success','更改成功！');
        res.redirect(url);
    });
});
//注册remove事件
router.get('/remove/:name/:day/:title',checkLogin);
router.get('/remove/:name/:day/:title',function(req,res){
    var currentUser = req.session.user,
        url = '/user/'+currentUser.name;
    Post.remove(currentUser.name,req.params.day,req.params.title,function(err){
        if(err){
            req.flash('error',err);
            return res.redirect('back');
        }
        req.flash('success','删除成功！');
        res.redirect(url);
    })
});
//comment
router.post('/user/:name/:day/:title',function(req,res){
    var date = new Date(),
        time = date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate()+'  '+date.getHours()+':'+(date.getMinutes()<10 ? '0'+date.getMinutes() : date.getMinutes());
    //创建comment对象
    var comment = {
        name: req.body.name,
        email: req.body.email,
        website: req.body.website,
        time: time,
        content: req.body.content
    };
    var newComment = new Comment(req.params.name,req.params.day,req.params.title,comment);
    newComment.save(function(err){
        if(err){
            req.flash('error',flash);
            return res.redirect('back');
        }
        req.flash('success','留言成功！');
        res.redirect('back');//留言成功后返回被留言的文章页
    });
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
