/**
 * Created by zakas on 15-5-3.
 */
var mongodb = require('./db');

function Post(name,title,tags,post){
    this.name = name;
    this.title = title;
    this.tags = tags;
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
        tags: this.tags,
        post: this.post,
        reprint_info: {},
        comments: [],     //增加评论
        pv: 0       //增加 pv 统计
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
                if(err){
                    mongodb.close();
                    return callback(err);
                }
                if(doc){
                    //每访问一次，pv值增加1
                    collection.update({
                        "name": name,
                        "time.day": day,
                        "title": title
                    },{"$inc": {"pv": 1}},function(err){
                        mongodb.close();
                        if(err){
                            return callback(err);
                        }
                    });
                    callback(null,doc);
                }
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
            },{"$set": {post: post}},function(err){
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
            collection.findOne({
                "name": name,
                "time.day": day,
                "title": title
            },function(err,doc){
                //切记不要提前关闭数据库，下面还会操作数据库
                if(err){
                    mongodb.close();
                    return callback(err);
                }
                var reprint_from ;
                if(doc.reprint_info.reprint_from){
                    reprint_from = doc.reprint_info.reprint_from;
                }
                if(reprint_from!=null){
                    //更新原文章所在文档的reprint_to
                    collection.update({
                        "name": reprint_from.name,
                        "time.day": reprint_from.day,
                        "title": reprint_from.title
                    },{
                        $pull: {
                            "reprint_info.reprint_to": {
                                "name": name,
                                "day": day,
                                "title": title
                            }
                        }
                    },function(err){
                        if(err) {
                            mongodb.close();
                            return callback(err);
                        }
                    });
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
    });
};
//一次获取10篇文章
Post.getTen = function(name,page,callback){
    //打开数据库
    mongodb.open(function(err,db){
        if(err){
            callback(err);
        }
        db.collection('posts',function(err,collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            var query = {};
            if(name){
                query.name = name;
            }
            //使用count返回特定查询的文档数total
            collection.count(query,function(err,total){
                //根据query对象查询，并跳过前(page-1)*10个结果,返回之后的10个结果
                collection.find(query,{
                    skip: (page-1)*2,//跳过这些页
                    limit:2
                }).sort({time: -1}).toArray(function(err,docs){//toArray(callback)Returns an array of documents.
                    mongodb.close();
                    if(err){
                        return callback(err);
                    }
                    callback(null,docs,total);
                });
            });
        });
    });
};

//返回所有文章存档信息
Post.getArchive = function(callback){
    mongodb.open(function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('posts',function(err,collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            //只返回name time title 这些键
            collection.find({},{
                "name": 1,
                "time": 1,
                "title": 1
            }).sort({time: -1}).toArray(function(err,docs){
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null,docs);
            });
        });
    });
};
//返回所有不同标签
Post.getTags = function(callback){
    mongodb.open(function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('posts',function(err,collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            //The distinct command returns returns a list of distinct values for the given key across a collection
            //返回出给定键的所有不同值[tag1,tag2,tag3,...]
            collection.distinct('tags',function(err,docs){
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null,docs);
            });
        });
    });
};
//返回指定标签
Post.getTag = function(tag,callback){
    mongodb.open(function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('posts',function(err,collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            //查询所有tags数组内包含tag的文档并只返回name,time,title键
            collection.find({"tags": tag},{
                name: 1,
                time: 1,
                title: 1
            }).sort({time: -1}).toArray(function(err,docs){
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null,docs);
            });
        });
    });
};
//返回通过关键字查询的所有文章信息
Post.search = function(keyword,callback){
    mongodb.open(function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('posts',function(err,collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            var pattern = new RegExp('^.*'+keyword+'.*$','i');
            collection.find({"title": pattern},{
                "name": 1,
                "time": 1,
                "title": 1
            }).sort({time: -1}).toArray(function(err,docs){
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null,docs);
            });
        });
    });
};
//转载一篇文章
Post.reprint = function(reprint_from,reprint_to,callback){
    mongodb.open(function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('posts',function(err,collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            //找到被转载的文章的文档
            collection.findOne({
                "name": reprint_from.name,//转载原文章信息
                "time.day": reprint_from.day,
                "title": reprint_from.title
            },function(err,doc){
                if(err){
                    mongodb.close();
                    return callback(err);
                }
                var date = new Date(),
                    time = {
                        date: date,
                        year: date.getFullYear(),
                        month: date.getFullYear()+'-'+(date.getMonth()+1),
                        day: date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate(),
                        minute: date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate()+' '+date.getHours()+':'+(date.getMinutes()<10 ? '0'+date.getMinutes() : date.getMinutes())
                    };
                delete doc._id;//删掉对象中的_id
                //更新副本的name time title pv comments
                doc.name = reprint_to.name;
                doc.time = time;
                doc.title = (doc.title.search(/[转载]/)>-1 ? doc.title : '[转载]'+doc.title);
                doc.comments = [];
                doc.reprint_info = {"reprint_from": reprint_from};//更新转载后文档的reprint_info内的reprint_from
                doc.pv = 0;
                //更新原文档的reprint_info内的reprint_to
                collection.update({
                    "name": reprint_from.name,
                    "time.day": reprint_from.day,
                    "title": reprint_from.title
                },{
                    $push: {
                        "reprint_info.reprint_to": {
                            "name": doc.name,
                            "day": time.day,
                            "title": doc.title
                        }
                    }
                },function(err){
                    if(err){
                        mongodb.close();
                        return callback(err);
                    }
                });
                //将生成的副本修改后存入数据库，并返回储存后的文档
                collection.insert(doc,function(err,post){
                    mongodb.close();
                    if(err){
                        return callback(err);
                    }
                    callback(null,post.ops[0]);
                });
            });
        });
    });
};

























