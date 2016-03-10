void function () {
	'use strict';

	var net  = require('net');

	var cwd = process.cwd();
	process.chdir(__dirname);
	var log = require('log-manager').setWriter(new require('log-writer')('rdp-proxy-%s.log')).getLogger();
	log.setLevel('trace');
	log.info('cwd:', cwd);

	var HTTP_PORT  = process.argv[2] || 3389;  // service port
	var PROXY_HOST = process.argv[3] || 'localhost';  // proxy server host
	var PROXY_PORT = process.argv[4] || 13389;    // proxy server port
	var OTHER_PORT = process.argv[5] || 8080;     // other server port

	if (!PROXY_HOST) return log.warn('proxy server not found');

	var server = net.createServer(function onCliConn(c) {
		var cliMsgCnt = 0;

		var remoteAddress = c.remoteAddress;
		if (remoteAddress.slice(0, 7) === '::ffff:')
			remoteAddress = remoteAddress.slice(7);

		log.debug('cliSoc: connected from %s', remoteAddress);

		var s = null;
		var svrQue = [];

		// enqueue command to server queue
		function enq(elem) {
			svrQue.push(elem);
			flush();
		} // function enq

		// flush server queue
		function flush() {
			if (!s) return;

			var elem;
			while (elem = svrQue.shift()) {
				switch (elem.cmd) {
					case 'write':
						s.write(elem.buff);
						break;
					case 'end':
						s.end();
						break;
					case 'destroy':
						s.destroy();
						break;
					default:
						log.warn('eh!? cmd case error ' + elem.cmd);
						s.destroy();
						break;
				} // switch
			} // while
		} // function flush

		//c.pipe(s);
		c.on('readable', function () {
			var buff = c.read();
			if (!buff) return;
			++cliMsgCnt;

			//s.write(buff);
			enq({cmd: 'write', buff: buff});

			if (s === null && cliMsgCnt === 1) {

				if (buff.length >= 2 && buff[0] === 0x03 && buff[1] === 0x00)
					s = net.connect(PROXY_PORT, PROXY_HOST, function onSvrConn(err) {
						if (err)
							log.warn('svrCon: %s (proxy)', err);
						flush();
						log.debug('svrCon: RDP');
					});
				else
					s = net.connect(OTHER_PORT, PROXY_HOST, function onSvrConn(err) {
						if (err)
							log.warn('svrCon: %s (other)', err);
						flush();
						log.debug('svrCon: Other "%s"',
								buff.toString().split('\n')[0].trim());
					});

				//s.pipe(c);
				s.on('readable', function () {
					var buff = s.read();
					if (!buff) return;
					c.write(buff);
				});
				s.on('end', function () { c.end();});
				s.on('error', function (err) {
					log.warn('svrSoc: %s', err);
					c.destroy();
				});

			}

			if (s === null) c.destroy();

		});
		c.on('end', function () {
			//s.end();
			enq({cmd: 'end'});
		});

		c.on('error', function (err) {
			log.warn('cliSoc: %s', err);
			if (s) {
				s.destroy();
				svrQue = [];
				s = null;
			}
			else enq({cmd: 'destroy'});
		});
	}).listen(HTTP_PORT, function () {
		process.on('uncaughtException', function (err) {
			//var msg1 = /\n    at exports._errnoException \(util.js:\d*:\d*\)\n    at TCP.onread \(net.js:\d*:\d*\)/;
			//log.error('uncExc %s', err.stack.replace(msg1, ''));
			log.error('uncExc %s', err);
		});
	});

	server.on('error', function onSvrErr(err) {
		log.warn('svrErr: %s', err);
	}); // server.on error

	log.info('port forwarder started on port ' + HTTP_PORT +
						' -> ' + PROXY_HOST + ':' + PROXY_PORT);
}();
