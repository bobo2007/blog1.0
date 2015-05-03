/**
 * Created by zakas on 15-4-27.
 */
var MongoClient = require('mongodb').MongoClient,
    assert = require('assert');
var url = 'mongodb://localhost:27017/data';
MongoClient.connect(url,function(err,db){
     assert.equal(null,err);
    console.log('Connected correctly to server');
    removeDocuments(db,function(){});
    insertDocuments(db,function(){
        //db.close();
    });
    findDocuments(db,function(){
        //db.close();
    });
    updateDocuments(db,function(){});
    findDocuments(db,function(){
       db.close();
    });

});
var insertDocuments = function(db,callback){
  var collection = db.collection('document');
    collection.insert([{a:1},{a:2},{a:3}],function(err,result){
        assert.equal(null,err);
        assert.equal(3,result.ops.length);
        console.log('Inserted 3 docs into the document collection');
        callback(result);
    });

};

var findDocuments = function(db,callback){
    var collection = db.collection('document');
    collection.find({}).toArray(function(err,docs){
      assert.equal(null,err);
      console.log('Found the following record');
      console.dir(docs);
      callback(docs) ;
    })
};

var removeDocuments = function(db,callback){
  var collection = db.collection('document');
    collection.remove();
    console.log('Remove all');
    callback();
};

var updateDocuments = function(db,callback){
  var collection = db.collection('document');
    collection.update({a:2},{$set:{b:1}},function(err,result){
        assert.equal(null,err);
        console.log('Updated the document with the field a equal to 2');
        callback(result);
    })
};
