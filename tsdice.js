'use strict';
var Client = require('node-teamspeak');

var settings = require('./config.json');

var clients = [];

var connections = {};

var completed = 0;

var pid = 0;

var exaltedDice = function (message) {
	var dice = message.match(/([0-9]+)e/);
	var double = message.match(/[ed]([0-9]+)/);
	var reroll = message.match(/r([0-9]+)/);
	var target = message.match(/t([0-9]+)/);
	var auto = message.match(/(\+|-)([0-9]+)/);
	var count = message.match(/c([0-9]+)/);
	var result;
	var builder = '';
	var successes = 0;
	var sucDice = 0;
	if (dice) {
		dice = parseInt(dice[1], 10);
	} else {
		dice = 0;
	}
	if (double) {
		double = parseInt(double[1], 10);
	} else {
		double = 10;
	}
	if (reroll) {
		reroll = reroll[1];
	} else {
		reroll = '';
	}
	if (target) {
		target = parseInt(target[1], 10);
	} else {
		target = 7;
	}
	if (auto) {
		auto = parseInt(auto[0], 10);
	} else {
		auto = 0;
	}
	if (count) {
		count = parseInt(count[1], 10);
	} else {
		count = 0;
	}
	while (dice > 0) {
		result = Math.floor(Math.random() * 10);
		while (reroll.indexOf(result) > -1) {
			result = Math.floor(Math.random() * 10);
		}
		if (result === 0) {
			result = 10;
		}
		if (result >= target) {
			successes += 1;
		}
		if (count) {
			if (result === count) {
				sucDice += 1;
			}
		} else {
			if (result >= target) {
				sucDice += 1;
			}
		}
		if (result >= double) {
			successes += 1;
		}
		if (result === 1) {
			builder += '[b][color=Red]' + result + '[/color][/b]';
		} else if (result >= double) {
			builder += '[b][color=Green]' + result + '[/color][/b]';
		} else if (result >= target) {
			builder += '[color=Green]' + result + '[/color]';
		} else {
			builder += result;
		}
		dice -= 1;
		if (dice > 0) {
			builder += ',';
		}
	}
	successes += auto;
	return builder + '\n' + 'SUCCESSES: ' + successes + '(' + sucDice + ')';
};

var wodDice = function (message) {
	var dice = message.match(/([0-9]+)w/);
	var again = message.match(/w([0-9]+)/);
	var auto = message.match(/(\+|-)([0-9]+)/);
	var result;
	var builder = '';
	var successes = 0;
	var sucDice = 0;
	if (dice) {
		dice = parseInt(dice[1], 10);
	} else {
		dice = 0;
	}
	if (again) {
		again = parseInt(again[1], 10);
	} else {
		again = 10;
	}
	if (auto) {
		auto = parseInt(auto[0], 10);
	} else {
		auto = 0;
	}
	while (dice > 0) {
		result = Math.floor(Math.random() * 10);
		if (result === 0) {
			result = 10;
		}
		if (result >= 8) {
			successes += 1;
		}
		if (result >= again) {
			dice += 1;
			sucDice += 1;
		}
		if (result === 1) {
			builder += '[b][color=Red]' + result + '[/color][/b]';
		} else if (result >= again) {
			builder += '[b][color=Green]' + result + '[/color][/b]';
		} else  if (result >= 8) {
			builder += '[color=Green]' + result + '[/color]';
		} else {
			builder += result;
		}
		dice -= 1;
		if (dice > 0) {
			builder += ',';
		}
	}
	successes += auto;
	return builder + '\n' + 'SUCCESSES: ' + successes + '(' + sucDice + ')';
};

var baseDice = function (message) {
	var dice = message.match(/([0-9]+)d([0-9]+)/);
	var auto = message.match(/(\+|-)([0-9]+)/);
	var diceSize;
	var total = 0;
	var builder = '';
	var result;
	if (dice) {
		diceSize = parseInt(dice[2], 10);
		dice = parseInt(dice[1], 10);
	} else {
		dice = 1;
		diceSize = 6;
	}
	if (auto) {
		auto = parseInt(auto[0], 10);
	} else {
		auto = 0;
	}while (dice > 0) {
		result = Math.floor(Math.random() * diceSize);
		if (result === 0) {
			result = diceSize;
		}
		if (result === 1) {
			builder += '[b][color=Red]' + result + '[/color][/b]';
		} else if (result === diceSize) {
			builder += '[b][color=Green]' + result + '[/color][/b]';
		} else {
			builder += result;
		}
		total += result;
		dice -= 1;
		if (dice > 0) {
			builder += ',';
		}
	}
	total += auto;
	return builder + '\n' + 'TOTAL: ' + total;
};

var clientInstance = function (id, cb) {
	var config = settings.accounts[id];
	var me = this;
	connections[id] = 0;
	me.cl = new Client(settings.server);
	me.uid = config.username;
	me.cid = 1;
	me.cl.send('login', {client_login_name: me.uid, client_login_password: config.password}, function(err, response) {
		console.log(id, err, response);
		me.cl.send('use', {sid: 1}, function (err, response) {
			console.log(id, err, response);
			me.cl.send('whoami', function (err, response) {
				console.log(id, err, response);
				me.clid = response.client_id;
				me.cl.send('clientupdate', {clid: me.clid, client_nickname: 'Dice Roller'}, function (err, response) {
					me.cl.send('servernotifyregister', {event: 'textchannel', id: 0}, function (err, response) {
						cb();
						me.cl.on('textmessage', function (params) {
							var msgParts = params.msg.match(/\((.+?)\)/);
							var result;
							var firstPart;
							var remainder = '';
							var labelStart = 0;
							var diceCode = '';
							if (msgParts && params.invokerid !== me.clid) {
								if (msgParts[1].indexOf('e') > -1) {
									result = exaltedDice(msgParts[1]);
								} else if (msgParts[1].indexOf('w') > -1) {
									result = wodDice(msgParts[1]);
								} else if (msgParts[1].indexOf('d') > -1) {
									result = baseDice(msgParts[1]);
								}
								labelStart = params.msg.indexOf(' ') + 1;
								if (params.msg.length > 30 && labelStart > 0) {
									firstPart = params.msg.substring(labelStart, 30 + labelStart);
									remainder = params.msg.substring(30 + labelStart);
									diceCode = params.msg.substring(0, labelStart);
								} else {
									if (labelStart > 0) {
										firstPart = params.msg.substring(labelStart);
										diceCode = params.msg.substring(0, labelStart);
									} else {
										firstPart = 'Dice Roller';
										diceCode = params.msg;
									}
								}
								me.cl.send('clientupdate', {clid: me.clid, client_nickname: firstPart}, function () {
									me.cl.send('sendtextmessage', {
										targetmode: 2, msg: remainder + '\n' + params.invokername +
										' rolling ' + diceCode + '\n' + result
									}, function (err, response) {
									});
								});
							}
						});
					});
				});
			});
		});
	});
	me.move = function (cid) {
		me.cl.send('clientmove', {clid: me.clid, cid: cid}, function () {
			me.cid = cid;
			connections[id] = me.cid;
		});
	};
	me.send = me.cl.send;
};

var manager = function () {
	var cl;
	completed++;
	if (completed >= settings.accounts.length) {
		cl = clients[0];
		cl.send('servernotifyregister', {event: 'channel', id:0}, function(err, response){
			cl.on('channelcreated', function (params) {
				if (params.cpid === pid) {
					clients.forEach(function(client, index){
						if (connections[index] === 0 || connections[index] === 1) {
							client.move(params.cid);
						}
					});
				}
			});
		});
	}
};

clients.push(new clientInstance(0, function () {
	clients[0].send('channellist', function(err, response){
		console.log(err, response);
		response.forEach(function(channel){
			if (channel.channel_name === settings.parent) {
				clients[0].pid = channel.cid;
				pid = channel.cid;
				clients[0].move(clients[0].pid);
			}
		});
	});
	manager();
}));

for (var i = 1; i < settings.accounts.length; i++) {
	clients.push(new clientInstance(i, manager));
}

//cl.send('login', {client_login_name: uid, client_login_password: config.password}, function(err, response){
//	cl.send('use', {sid: 1}, function(err, response){
//		cl.send('whoami', function (err, response) {
//			clid = response.client_id;
//			cl.send('clientupdate', {clid: clid, client_nickname: 'Dice Roller'}, function (err, response) {
//				cl.send('servernotifyregister', {event: 'textchannel', id:0}, function(err, response){
//					cl.on('textmessage', function (params) {
//						var msgParts = params.msg.match(/\((.+?)\)/);
//						var result;
//						var firstPart;
//						var remainder = '';
//						var labelStart = 0;
//						var diceCode = '';
//						if (msgParts && params.invokerid !== clid) {
//							if (msgParts[1].indexOf('e') > -1) {
//								result = exaltedDice(msgParts[1]);
//							} else if (msgParts[1].indexOf('w') > -1) {
//								result = wodDice(msgParts[1]);
//							} else if (msgParts[1].indexOf('d') > -1) {
//								result = baseDice(msgParts[1]);
//							}
//							labelStart = params.msg.indexOf(' ') + 1;
//							if (params.msg.length > 30 && labelStart > 0) {
//								firstPart = params.msg.substring(labelStart,30 + labelStart);
//								remainder = params.msg.substring(30 + labelStart);
//								diceCode = params.msg.substring(0,labelStart);
//							} else {
//								if (labelStart > 0) {
//									firstPart = params.msg.substring(labelStart);
//									diceCode = params.msg.substring(0,labelStart);
//								} else {
//									firstPart = 'Dice Roller';
//									diceCode = params.msg;
//								}
//							}
//							cl.send('clientupdate', {clid: clid, client_nickname: firstPart}, function () {
//								cl.send('sendtextmessage', { targetmode: 2, msg: remainder + '\n' + params.invokername +
//								' rolling ' + diceCode + '\n' + result }, function (err, response) {});
//							});
//						}
//					});
//				});
//				cl.send('servernotifyregister', {event: 'channel', id:0}, function(err, response){
//					cl.on('channelcreated', function (params) {
//						if (params.cpid === pid && cid === 1) {
//							cl.send('clientmove', {clid: clid, cid: params.cid}, function () {
//								cid = params.cid;
//							});
//						}
//					});
//				});
//				cl.on('clientmoved', function (params) {
//					if (cid !== 1) {
//						cl.send('clientlist', {cid: cid}, function (err, response) {
//							var empty = true;
//							response.forEach(function (event) {
//								if (event.cid === cid && event.clid !== clid) {
//									empty = false;
//								}
//							});
//							if (empty) {
//								cl.send('clientmove', {clid: clid, cid: 1}, function () {
//									cid = 1;
//								});
//							}
//						});
//					}
//				});
//			});
//
//		});
//	});
//});