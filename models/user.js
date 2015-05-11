/**
 * Created by zakas on 15-5-3.
 */
var mongodb = require('./db');
var console = require('console');
function User(user){
    this.name = user.name;
    this.password = user.password;
    this.email = user.email;
}

module.exports = User;  //输出User对象

//储存用户信息
User.prototype.save = function(callback){
    //要存入数据库的文档
    var user = {
        name: this.name,
        password: this.password,
        email: this.email
    };
    //打开数据库
    mongodb.open(function(err,db){
        if(err){
            return callback(err);
        }
        //读取users集合
        db.collection('users',function(err,collection){
           if(err){
               mongodb.close();
               return callback(err);
           }
           //将用户插入users集合
           collection.insertOne(user,{w:1},function(err,user){
               //console.dir(user);
               mongodb.close();
               if(err){
                   return callback(err);
               }
               callback(null,user.ops[0]);//成功 返回储存后的文档
           });
        });
    });
};

//读取用户信息
User.get = function(name,callback){
    //打开数据库
    mongodb.open(function(err,db){
        if(err){
            return callback(err);
        }
        //读取users集合
        db.collection('users',function(err,collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            collection.findOne({
                name: name
            },function(err,user){
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null,user);//成功 返回读取的文档
            });
        });
    });
};




















