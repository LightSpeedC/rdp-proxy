'use strict';

var port = 8080;
var http = require('http');
var host = process.env.COMPUTERNAME.toLowerCase() ||
	process.env.HOSTNAME.toLowerCase();

var server = http.createServer(function (req, res) {
	res.writeHead(200, {'Content-Type': 'text/plain; charset=utf-8'});
	console.log([req.method, req.url].join(' '));
	res.end('Hello World! host:' + host + ', port:' + port + ' ' + new Date() + '\n');
});
server.listen(port, function () {
	console.log('Server running at http://localhost:' + port);

	server.on('connection', function (soc) {
		console.log('server connected ');
		soc.on('disconnect', function () {
			console.log('server disconnected ');
		});
	});
});

console.log('Server starting at http://localhost:' + port);
