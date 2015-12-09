'use strict';
var net  = require('net');
var HTTP_PORT  = process.argv[2] || 3389;  // service port
var PROXY_HOST = process.argv[3] || 'localhost';  // proxy server host
var PROXY_PORT = process.argv[4] || 13389;    // proxy server port
var OTHER_PORT = process.argv[5] || 8080;     // other server port

if (!PROXY_HOST) return console.log('proxy server not found');

var server = net.createServer(function onCliConn(cliSoc) {
	var cliMsgCnt = 0;

	var remoteAddress = cliSoc.remoteAddress;
	if (remoteAddress.slice(0, 7) === '::ffff:')
		remoteAddress = remoteAddress.slice(7);

	console.log('%s cliSoc: connected from %s',
		new Date().toLocaleTimeString(),
		remoteAddress);

	var svrSoc = null;
	var svrQue = [];

	// enqueue command to server queue
	function enq(elem) {
		svrQue.push(elem);
		flush();
	} // function enq

	// flush server queue
	function flush() {
		if (!svrSoc) return;

		var elem;
		while (elem = svrQue.shift()) {
			switch (elem.cmd) {
				case 'write':
					svrSoc.write(elem.buff);
					break;
				case 'end':
					svrSoc.end();
					break;
				case 'destroy':
					svrSoc.destroy();
					break;
				default:
					console.log('eh!? case error ' + elem.cmd);
					svrSoc.destroy();
					break;
			} // switch
		} // while
	} // function flush

	//cliSoc.pipe(svrSoc);
	cliSoc.on('readable', function () {
		var buff = cliSoc.read();
		if (!buff) return;
		++cliMsgCnt;

		//svrSoc.write(buff);
		enq({cmd: 'write', buff: buff});

		if (svrSoc === null && cliMsgCnt === 1) {

			if (buff.length >= 2 && buff[0] === 0x03 && buff[1] === 0x00)
				svrSoc = net.connect(PROXY_PORT, PROXY_HOST, function onSvrConn(err) {
					if (err)
						console.log('%s svrCon: %s (proxy)',
							new Date().toLocaleTimeString(), err);
					flush();
					console.log('%s svrCon: RDP',
							new Date().toLocaleTimeString());
				});
			else
				svrSoc = net.connect(OTHER_PORT, PROXY_HOST, function onSvrConn(err) {
					if (err)
						console.log('%s svrCon: %s (other)',
							new Date().toLocaleTimeString(), err);
					flush();
					console.log('%s svrCon: Other "%s"',
							new Date().toLocaleTimeString(),
							buff.toString().split('\n')[0].trim());
				});

			//svrSoc.pipe(cliSoc);
			svrSoc.on('readable', function () {
				var buff = svrSoc.read();
				if (!buff) return;
				cliSoc.write(buff);
			});
			svrSoc.on('end', function () { cliSoc.end();});
			svrSoc.on('error', function (err) {
				console.log('%s svrSoc: %s', new Date().toLocaleTimeString(), err);
				cliSoc.destroy();
			});

		}

		if (svrSoc === null) cliSoc.destroy();

	});
	cliSoc.on('end', function () {
		//svrSoc.end();
		enq({cmd: 'end'});
	});

	cliSoc.on('error', function (err) {
		console.log('%s cliSoc: %s', new Date().toLocaleTimeString(), err);
		if (svrSoc) {
			svrSoc.destroy();
			svrQue = [];
			svrSoc = null;
		}
		else enq({cmd: 'destroy'});
	});
}).listen(HTTP_PORT, function () {
	process.on('uncaughtException', function (err) {
		var msg1 = /\n    at exports._errnoException \(util.js:\d*:\d*\)\n    at TCP.onread \(net.js:\d*:\d*\)/;
		console.log('uncExc %s', err.stack.replace(msg1, ''));
	});
});

server.on('error', function onSvrErr(err) {
	console.log('%s svrErr: %s', new Date().toLocaleTimeString(), err);
}); // server.on error

console.log('port forwarder started on port ' + HTTP_PORT +
						' -> ' + PROXY_HOST + ':' + PROXY_PORT);
