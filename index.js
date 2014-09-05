
/**
 * Module dependencies
 */

var Strategy = require('sauth/strategy')
  , qs = require('querystring')
  , url = require('url')
  , http = require('http')
  , exec = require('child_process').exec
  , OAuth = require('oauth').OAuth
  , readline = require('readline')

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

var question = rl.question.bind(rl);

/**
 * Twitter OAuth API endpoint
 */

var OAUTH_API_ENDPOINT = 'https://api.twitter.com/oauth';

/**
 * Initializes the instagram strategy
 *
 * @api public
 * @param {Object} opts
 * @param {Function} done
 */

module.exports = function (opts, done) {
  return TwitterStrategy(opts).run(done);
};

/**
 * `TwitterStrategy' constructor
 *
 * @api public
 * @param {Object} opts
 */

module.exports.Strategy = TwitterStrategy;
function TwitterStrategy (opts) {
  if (!(this instanceof TwitterStrategy)) {
    return new TwitterStrategy(opts);
  }

  Strategy.call(this, 'twitter');

  this.key = opts['consumer-key'] || opts.consumerKey || opts.consumer_key;
  this.secret = opts['consumer-secret'] || opts.consumerSecret || opts.consumer_secret;
  this.redirectUri = opts['redirect-uri'] || opts.redirectUri|| opts.redirect_uri;
  this.oob = Boolean(opts.oob || opts['out-of-bounds'] || opts['out_of_bounds']);
  this.port = opts.port || opts.p;
  this.verifier = null;
  this.oauth = {};
}

// inherit `TwitterStrategy'
TwitterStrategy.prototype = Object.create(Strategy.prototype, {
  constructor: {value: TwitterStrategy}
});

// implements `_setup'
TwitterStrategy.prototype._setup = function (done) {
  var self = this;
  this.oauth = new OAuth(
    OAUTH_API_ENDPOINT + '/request_token',
    OAUTH_API_ENDPOINT + '/access_token',
    this.key, this.secret, '1.0', null, 'HMAC-SHA1');

  done();
};

// implements `_auth'
TwitterStrategy.prototype._auth = function (done) {
  var self = this;
  var oauth = this.oauth;
  oauth.getOAuthRequestToken({oauth_callback: this.redirectUri}, function (err, token, secret, res) {
    if (err) { return done(err); }
    self.requestToken = token;
    self.requestTokenSecret = secret;
    if (self.oob) { self._handleOob(done); }
    else if (self.redirectUri) { self._handleRedirect(done); }
  });
};

TwitterStrategy.prototype._handleOob = function (done) {
  var u = OAUTH_API_ENDPOINT +'/authorize?oauth_token='+ this.requestToken;
  this._open(u, function (err) {
    if (err) { return done(err); }
    question("Enter your PIN after authorization: ", function (pin) {
      if (!pin) { return done(new Error("Missing PIN")); }
      self.verifier = pin;
      done();
    });
  });
};

TwitterStrategy.prototype._handleRedirect = function (done) {
  var self = this;
  var u = OAUTH_API_ENDPOINT +'/authenticate?oauth_token='+ this.requestToken;
  var port = this.port || url.parse(this.redirectUri).port;
  this._open(u, function (err) {
    if (err) { return done(err); }
    var server = http.createServer(onrequest).listen(port);
    var sockets = [];
     server.on('connection', function (socket) {
       sockets.push(socket);
       socket.setTimeout(1000);
     });
    function onrequest (req, res) {
      self.verifier = qs.parse(url.parse(req.url).query).oauth_verifier;
      res.setHeader('Connection', 'close');
      res.write('<script> window.close(); </script>');
      res.end();
      server.close(done);
      sockets.forEach(function (socket) { socket.destroy(); });
    }
  });
};

TwitterStrategy.prototype._open = function (uri, done) {
  exec('open '+ uri, function (err) {
    if (err) { return done(err); }
    done();
  });
};

// implements `_access'
TwitterStrategy.prototype._access = function (done) {
  var self = this;
  var oauth = this.oauth;
  oauth.getOAuthAccessToken(
    this.requestToken,
    this.requestTokenSecret,
    this.verifier,
    function (err, token, secret, res) {
      if (err) { return done(err); }
      self.accessToken = token;
      self.accessTokenSecret = secret;
      self.data = res;
      done();
    });
};

// implements `_end'
TwitterStrategy.prototype._end = function (done) {
  console.log({
    access_token: this.accessToken,
    access_token_secret: this.accessTokenSecret,
    user: this.data
  });
  done();
};

