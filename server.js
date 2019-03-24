'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var urlexists = require('url-exists');
var cors = require('cors');
var bodyParser = require('body-parser');

var app = express();


// Basic Configuration 
var port = process.env.PORT || 3000;
mongoose.set('useCreateIndex', true);
var Schema = mongoose.Schema;
var urlSchema = new Schema({
	originalurl: {
		type: String,
		required: true
	},
	shorturl: {
		type: Number,
    default: 1,
    unique:true
	}
});
urlSchema.pre('save', function(next){
	var doc = this;
  Url.findOne().sort({shorturl:-1}).exec(function(err,data){
    if(err){next(err);}
    if(data){
      doc.shorturl=data.shorturl+1;
      next();
    }else{next();}
  });
});
var Url = mongoose.model('Url', urlSchema);
mongoose.connect(process.env.MONGO_URI, {
	useNewUrlParser: true
});
/** this project needs a db !! **/
// mongoose.connect(process.env.MONGOLAB_URI);

app.use(cors());
app.use(bodyParser.urlencoded({
	extended: false
}));
/** this project needs to parse POST bodies **/
// you should mount the body-parser here

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function (req, res) {
	res.sendFile(process.cwd() + '/views/index.html');
});


// your first API endpoint... 
app.get("/api/hello", function (req, res) {
	res.json({
		greeting: 'hello API'
	});
});


app.post("/api/shorturl/new", function (req, res, next) {
	if (req.body) {
		var testurl = req.body.url;
		if (!testurl) return next(new Error("Request url not found."));
		urlexists(testurl, function (err, exists) {
			if (err) {
				return next(err);
			}
			if(exists){
			var newUrl = new Url({
				originalurl: testurl
			});
			Url.create(newUrl, function (eror, data) {
				if (eror) {
					return next(eror);
				}
				if (!data) return next(new Error("Insert error."));
				Url.findOne({
					_id: data._id
				}, function (errrr, dataa) {
					if (errrr) return next(errrr);
					res.json({
						original_url: dataa.originalurl,
						short_url: dataa.shorturl
					});
				});      
			});
      }else{res.json({"error":"invalid URL"});}
		});
	} else {
		return next(new Error("Body not found."));
	}
});

app.get("/api/shorturl/:urlnum",function(req,res,next){
  if(req.params.urlnum){
    var surl=req.params.urlnum;
    Url.findOne({shorturl:surl},function(err,data){
      if(err){next(err);}
      if(data){
      res.redirect(data.originalurl);
      next();}else{next(new Error("Url not found."));}  
    });
  }
});

app.get('/is-mongoose-ok', function (req, res) {
	if (mongoose) {
		res.json({
			isMongooseOk: !!mongoose.connection.readyState
		})
	} else {
		res.json({
			isMongooseOk: false
		})
	}
});
// Error handler
app.use(function (err, req, res, next) {
	if (err) {
		console.log(err);
		res.status(err.status || 500)
			.type('txt')
			.send(err.message || 'SERVER ERROR');
	}
});

app.listen(port, function () {
	console.log('Node.js listening ...');
});