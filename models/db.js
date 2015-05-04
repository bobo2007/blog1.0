/**
 * Created by zakas on 15-5-3.
 */
var setting = require('../setting'),
    Db = require('mongodb').Db,
    Server = require('mongodb').Server;
module.exports = new Db(setting.db,new Server(setting.host,27017),{});
