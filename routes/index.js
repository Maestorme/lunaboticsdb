var express = require('express');
var router = express.Router();
var mongo = require('mongodb').MongoClient;
var objectId = require('mongodb').ObjectID;
var assert = require('assert');
var request = require('request');
var fs = require('fs');
var formidable = require('formidable');

var url = 'mongodb://localhost:27017/lunabotics';

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});


router.get('/add', function(req, res, next) {
  res.render('add', { title: 'Express' });
});

router.get('/view', function(req, res, next) {
	var members =[];
	mongo.connect(url, function(err, db){
		assert.equal(null, err);

		var cursor = db.collection('members').find();
		cursor.forEach(function(doc, err){
			assert.equal(null, err);

			//console.log(doc.lastname, doc.log);
			var member = {}	
			member.first = doc.firstname;
			member.last = doc.lastname;
			member.puid = doc.puid;
			member.email = doc.email;
			member.subteam = doc.subteam;
			member.log = doc.log;

			members.push(member)

		}, function(){
			db.close();
			//console.log(members);
			res.render('view', {memberlist: members});
		});
	});


  
});


router.post('/submit-id', function(req, res, next){
	console.log("Hello!");
	console.log(req.body.puid.substr(1))
	var today = new Date();
	var time = today.toLocaleTimeString();
	var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();

	var member = {}
	mongo.connect(url, function(err, db){
		assert.equal(null, err);

		
		console.log("INSIDE MONGO")
		var cursor = db.collection('members').find({puid: parseInt(req.body.puid.substr(1))});
		cursor.forEach(function(doc, err){
			assert.equal(null, err);
			//console.log(doc.firstname, doc.lastname);	
			member.first = doc.firstname;
			member.last = doc.lastname;
			member.log = doc.log;
		}, function(){
			var myquery = { puid: parseInt(req.body.puid.substr(1)) };
			if (typeof member.log == 'undefined'){
				member.log = {}
			}

			try{
				member.log[date].push(time)
			}
			catch(error){
				member.log[date] = [time]
			}
			// if (typeof member.log[date] == 'object'){
			// 	member.log[date].push(time);
			// }
			// else{
			// 	member.log[date] = [time];
			// }
  			var newvalues = { $set: {log: member.log } };
			db.collection('members').updateOne(myquery, newvalues, function(err, res){
				assert.equal(null, err);
				console.log("Log Updated");
				db.close();

				
			});	
			console.log("NAME: "+member.first+" "+member.last+" : "+time);
			res.render('index', {first: member.first, last: member.last, temp: "Hello", check_in_time: time});		
		});
	});
});

router.post('/add-new', function(req, res, next){
	mongo.connect(url, function(err, db){
		assert.equal(null, err);
		var user = {
			"puid": req.body.puid,
			"firstname": req.body.firstname,
			"lastname": req.body.lastname,
			"email": req.body.email,
			"subteam": req.body.subteam
		}
		db.collection('members').insertOne(user, function(error, result){
					assert.equal(null, error);
					console.log('member inserted');
					db.close();
					res.redirect('/');
		});
	});
});

router.get('/members/:puid', function(req, res, next){
	console.log(req.params)
	var content = "<h1>Member has not checked in yet!</h1>"
	mongo.connect(url, function(err, db){
		assert.equal(null, err);

		var cursor = db.collection('members').find({puid: parseInt(req.params.puid)});
		cursor.forEach(function(doc, err){
			contentJSON = doc.log
			content = '<h2>'+JSON.stringify(doc.log)+'</h2>'
		}, function(){
			db.close();
			var keys = []
			for(var k in contentJSON) keys.push(k);

			keys.sort().reverse();

			res.render('times', {dates: keys, logs: contentJSON});	
			//res.set('Content-Type', 'text/html');
			//res.send(new Buffer(content));		
		});
	})
});

module.exports = router;
