// server.js
// where your node app starts

// init project
var express = require('express');
var http = require('http');
var request = require('request');
var bodyParser = require('body-parser');
var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// we've started you off with Express, 
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

app.post('/', (req, res) => {
  var text = req.body.text;
  var ret_text = "Here is what I found for *\"" + text + "\"*\n";
  
  make_wa_call(text, function(ret_data){
    ret_text += "`"+ret_data+"`";
    //console.log(ret_text);
  
    var data = {
      response_type: 'in_channel', // public to the channel
      text: ret_text
    };
    res.json(data);  
  });
  
  
});

app.get('/slack', function(req, res){
  var data = {form: {
      client_id: process.env.SLACK_CLIENT_ID,
      client_secret: process.env.SLACK_CLIENT_SECRET,
      code: req.query.code
  }};
  request.post('https://slack.com/api/oauth.access', data, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      // You are done.
      // If you want to get team info, you need to get the token here
      var token = JSON.parse(body).access_token; // Auth token
      request.post('https://slack.com/api/team.info', {form: {token: token}},function (error, response, body) {
        if (!error && response.statusCode == 200) {
          var team = JSON.parse(body).team.domain;
          res.redirect('http://' +team+ '.slack.com');
        }
      });
      
    }
  });
});
               

// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});

function make_wa_call(query, callback) {
  
  var wa_url = "http://api.wolframalpha.com/v2/query?format=plaintext&output=JSON&includepodid=Result&appid="+process.env.WOLFRAM_APPID+"&input="+query;
  console.log(wa_url);
  
  http.get(wa_url, function(res) {
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      //console.log('BODY: ' + chunk);
      res=JSON.parse(chunk)
      //console.log(res.queryresult.success);
      //console.log(res.queryresult.didyoumeans.val);
      if(res.queryresult.pods) {
        var ret = res.queryresult.pods[0].subpods[0].plaintext;
        //console.log(ret);
        callback(ret);
      } else {
        callback("Sorry, couldn't find anything");
      }
    });
    res.on('error', function (e) {
      console.log('Error: ' + e);
      callback("Error: "+e);
    });
  }).end();
  
}
