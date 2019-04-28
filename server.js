'use strict';

const dns = require('dns');
const bodyParser = require("body-parser");
var express = require('express');
var mongo = require('mongodb');

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
// mongoose.connect(process.env.MONGOLAB_URI);
mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true});

const MongoClient = require('mongodb').MongoClient;
const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, { useNewUrlParser: true });
client.connect(err => {
  const collection = client.db("test").collection("devices");
  // perform actions on the collection object
  client.close();
});

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({entended: true}));

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

 // URL Schema
const shortenSchema = new Schema({
  url: String,
});

// URL Model
const Url = mongoose.model("Url", shortenSchema);

// add url
const addUrl = (originalUrl) => {
  const url = new Url({url: originalUrl});
  url.save((err, data) => {
    if (err) {throw err;} 
  });
}

// clear database
const clear = () => {
  Url.deleteMany({}, (err, data) => {
    if (err) {throw err;}
  });
};

// get new url
app.get('/api/shorturl/:new', (req, res) => {
  const shortUrl = req.params.new;
  if (shortUrl === "short") {
    Url.findOne({}, (err, data) => {
      if (err) {throw err;}
      else {
        const origUrl = data.toObject;
        clear();
        res.status().redirect(data.url);
      }
    })
  }
});

// post url to Url collections
app.post('/api/shorturl/new', (req, res) => {
  const originalUrl = req.body.url;
  dns.lookup(removeProtocol(originalUrl), (err, address, family) => {
    if (err) {
      res.send({error: "invalid URL"}); 
    } else {
      addUrl(originalUrl);
      res.send({
        original_url: originalUrl,
        short_url: "short"
      }); 
    }
  });
});

// remove protocol (http:// or https://)
const removeProtocol = (url) => {
  if (url.indexOf("https://" != -1)) {
    return url.substring(8, url.length);
  }
  if (url.indexOf("http://" != -1)) {
    return url.substring(7, url.length); 
  }
  return url;
}

app.listen(port, function () {
  console.log('Node.js listening ...');
});