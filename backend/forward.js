var express = require('express');
var app = module.exports = express();

var proxy = require('http-proxy').createProxyServer({
    host: 'http://206.189.109.114',
});
app.use('/blog', function(req, res, next) {
    proxy.web(req, res, {
        target: 'http://206.189.109.114'
    }, next);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, function(){
    console.log('Listening!');
});
