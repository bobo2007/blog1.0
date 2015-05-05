/**
 * Created by zakas on 15-5-3.
 */
var mongodb = require('./db');

function Post(name,title,post){
    this.name = name;
    this.title = title;
    this.post = post;
}
module.exports = Post;

//存储一篇文章及其相关信息
Post.prototype.save = function(callback){
    var date = new Date();
    //存储各种时间格式 方便扩展
    var time = {
        date: date,
        year: date.getFullYear(),
        month: date.getFullYear()+'-'+(date.getMonth()+1),
        day: date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate(),
        minute: date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate()+' '+date.getHours()+':'+(date.getMinutes()<10 ? '0'+date.getMinutes() : date.getMinutes())
    };
    //要存入数据库的文档
    var post = {
        name: this.name,
        time: time,
        title: this.title,
        post: this.post,
        comments: []     //增加评论
    };
    //打开数据库
    mongodb.open(function(err,db){
        if(err){
            return callback(err);
        }
        //读取posts集合
        db.collection('posts',function(err,collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            collection.insert(post,function(err){
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null);
            })
        });
    });
};

//读取文章及相关信息(可按指定用户获取，也可获取全部)
//获取个人所有文章或获取所有人的文章
Post.getAll = function(name,callback){
    mongodb.open(function(err,db){
        if(err){
            return callback(err);
        }
        //读取posts集合
        db.collection('posts',function(err,collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            var query = {};//query为null为查询全部
            if(name){
                query.name = name;
            }
            //降序排列
            collection.find(query).sort({time:-1}).toArray(function(err,docs){
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null,docs);
            })
        });
    });
};
//获取一篇文章
Post.getOne = function(name,day,title,callback){
    //打开数据库
    mongodb.open(function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('posts',function(err,collection){
           if(err){
               mongodb.close();
               return callback(err);
           }
            //根据用户名 发表日期 文章名进行查询
            collection.findOne({
                "name": name,
                "time.day": day,
                "title": title
            },function(err,doc){
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null,doc);
            });
        });
    });
};
//返回原始发表的内容
Post.edit = function(name,day,title,callback){
    //打开数据库
    mongodb.open(function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('posts',function(err,collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            collection.findOne({
                "name": name,
                "time.day": day,
                "title": title
            },function(err,post){
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null,post);
            });
        });
    });
};
//更新一篇文章及相关信息
Post.update = function(name,day,title,post,callback){
    mongodb.open(function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('posts',function(err,collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            //更新文章内容
            collection.update({
                "name": name,
                "time.day": day,
                "title": title
            },{$set: {post: post}},function(err){
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null);
            });
        });
    });
};
//删除一篇文章
Post.remove = function(name,day,title,callback){
    mongodb.open(function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('posts',function(err,collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            collection.remove({
                "name": name,
                "time.day": day,
                "title": title
            },{w:1},function(err){
                mongodb.close();
                if(err){
                  return callback(err);
                }
                callback(null);
            });
        });
    });
};



