'use strict';
var Client = require('node-teamspeak');

var uids = ['serveradmin', 'Query2'];
var pwds = ['GtzUz1Ev', 'ym0x89u3'];
var config = require('./config.json');
var cl = new Client(config.server);
var uid = config.username;
var clid;
var cid = 1;
var pid;
var clientMessageStatus = {};
var storyteller;
var tracker = {};
var back = [];
var forward = [];
var output = '';

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
	return builder + '\n' + '[b]SUCCESSES: ' + successes + '(' + sucDice + ')[/b]';
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
	return builder + '\n' + '[b]SUCCESSES: ' + successes + '(' + sucDice + ')[/b]';
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
	return builder + '\n' + '[b]TOTAL: ' + total + '[/b]';
};

var keepAlive = function () {
	cl.send('channellist', function(err, response){
				setTimeout(keepAlive, 120000);
			});
};

var welcome = function (params) {
	var target = params.clid;
	var msg = 'Welcome! I am the Dice Bot!';
	if (clientMessageStatus[target] === undefined) {
		clientMessageStatus[target] = 0;
	}
	if (clientMessageStatus[target] % 2 === 1) {
		msg = 'You can send me any dice commands in this window, and I will roll them in secret and send the results to you and the Storyteller';
	}
	clientMessageStatus[target] += 1;
	cl.send('sendtextmessage', {
		targetmode: 1, target: target, msg: msg
	}, function (err, response) {});
};

var initiativeHandler = function (params) {
	var raw = params.msg.substr(1);
	var parts = raw.split(' ');
	var command = parts[0];
	var highest = -9999999;
	var active = [];
	var sendMessage = function (msg) {
		cl.send('clientupdate', {clid: clid, client_nickname: 'Initiative'}, function () {
			cl.send('sendtextmessage', {
				targetmode: 2, msg: msg
			}, function (err, response) {
				cl.send('clientupdate', {clid: clid, client_nickname: 'Dice Roller'}, function () {});
			});
		});
	};
	var reset = function () {
		var oldTracker = JSON.parse(JSON.stringify(tracker));
		tracker = {};
		back.push(function (un) {
			if (un==='undo') {
				tracker = oldTracker;
				sendMessage('Undoing reset');
			} else {
				tracker = {};
				sendMessage('Redoing reset');
			}
		});
	};
	var next = function () {
		Object.keys(tracker).forEach(function (actor) {
			actor = tracker[actor];
			if (!actor.acted) {
				if (actor.initiative > highest) {
					highest = actor.initiative;
					active = [actor];
				} else if (actor.initiative === highest) {
					active.push(actor);
				}
			}
		});
		if (active.length > 0) {
			output = highest + ':';
			active.forEach(function (actor) {
				actor.acted = true;
				output += ' ' + actor.name + ',';
			});
			output = output.replace(/,$/, '');
			sendMessage(output);
			back.push(function (un) {
				if (un === 'undo') {
					active.forEach(function (actor) {
						actor.acted = false;
					});
					sendMessage('Undoing next turn');
				} else {
					active.forEach(function (actor) {
						actor.acted = true;
					});
					sendMessage('Redoing next turn');
				}
			});
		} else {
			sendMessage('NEW TURN');
			Object.keys(tracker).forEach(function (actorId) {
				var actor = tracker[actorId];
				actor.acted = false;
			});
			list();
			back.push(function (un) {
				if (un === 'undo') {
					Object.keys(tracker).forEach(function (actorId) {
						var actor = tracker[actorId];
						actor.acted = true;
					});
					sendMessage('Undoing New Turn');
				} else {
					Object.keys(tracker).forEach(function (actorId) {
						var actor = tracker[actorId];
						actor.acted = false;
					});
					sendMessage('NEW TURN');
					list();
					sendMessage('Redoing New Turn');
				}
			});
		}
	};
	var add = function () {
		var name = parts[1];
		var actor = {
			name: name,
			initiative: parseInt(parts[2], 10) || 0,
			acted: false
		};
		tracker[name] = actor;
		back.push(function (un) {
			if (un === 'undo') {
				delete tracker[name];
				sendMessage('Deleting ' + name);
			} else {
				tracker[name] = actor;
				sendMessage('Readding ' + name);
			}
		});
	};
	var remove = function () {
		var actor = tracker[parts[1]];
		var name = actor.name;
		if (!!actor) {
			delete tracker[name];
			back.push(function (un) {
				if (un === 'undo') {
					tracker[name] = actor;
					sendMessage('Re-adding ' + name);
				} else {
					delete tracker[name];
					sendMessage('Re-deleting ' + name);
				}
			});
		}
	};
	var list = function () {
		var output = [],
		toPrint = '';
		Object.keys(tracker).forEach(function (name) {
			output.push(tracker[name].initiative + ' ' + name);
		});
		output.sort(function (a, b) { return parseFloat(b.split(' ')[0]) - parseFloat(a.split(' ')[0]) });
		output.forEach(function (val) {
			toPrint += val + '\n';
		});
		sendMessage('\n' + toPrint.replace(/\n$/, ''));
	};
	var set = function () {
		var oldValue = tracker[parts[1]].initiative;
		var newValue = parseInt(parts[2], 10);
		var name = parts[1];
		tracker[name].initiative = newValue;
		back.push(function (un) {
			if (un==='undo') {
				tracker[name].initiative = oldValue;
				sendMessage('Reset ' + name + '\'s initiative to ' + oldValue);
			} else {
				tracker[name].initiative = newValue;
				sendMessage('Re-set ' + name + '\'s initiative to ' + newValue);
			}
		});
	};
	var modify = function () {
		var oldValue = tracker[parts[1]].initiative;
		var newValue = oldValue + parseInt(parts[2], 10);
		var name = parts[1];
		tracker[name].initiative = newValue;
		back.push(function (un) {
			if (un==='undo') {
				tracker[name].initiative = oldValue;
				sendMessage('Reset ' + name + '\'s initiative to ' + oldValue);
			} else {
				tracker[name].initiative = newValue;
				sendMessage('Re-set ' + name + '\'s initiative to ' + newValue);
			}
		});
	};
	var withering = function () {
		var aName = parts[1];
		var dName = parts[2];
		var attackerOldValue = tracker[aName].initiative;
		var attackerNewValue = attackerOldValue + parseInt(parts[3], 10) + 1;
		var defenderOldValue = tracker[dName].initiative;
		var defenderNewValue = defenderOldValue - parseInt(parts[3], 10);
		if (defenderNewValue <= 0) {
			attackerNewValue += 5;
			sendMessage(dName + ' is CRASHED');
		}
		tracker[aName].initiative = attackerNewValue;
		tracker[dName].initiative = defenderNewValue;
		back.push(function (un) {
			if (un==='undo') {
				tracker[aName].initiative = attackerOldValue;
				tracker[dName].initiative = defenderOldValue;
				sendMessage('Undoing withering attack');
			} else {
				tracker[aName].initiative = attackerNewValue;
				tracker[dName].initiative = defenderNewValue;
				sendMessage('Redoing withering attack');
			}
		});
	};
	var undo = function() {
		var func;
		if (back.length > 0) {
			func = back.pop();
			func('undo');
			forward.push(func);
		} else {
			sendMessage('Nothing to Undo');
		}
	};
	var redo = function() {
		var func;
		if (forward.length > 0) {
			func = forward.pop();
			func('redo');
			back.push(func);
		} else {
			sendMessage('Nothing to Redo');
		}
	};
	var check = function () {
		var name = parts[1];
		var output = tracker[name].initiative + ' ' + name;
		sendMessage(output);
	};
	try {
		switch (command) {
			case 'reset':
				reset();
				break;
			case 'next':
				next();
				break;
			case 'add':
				add();
				break;
			case 'list':
				list();
				break;
			case 'check':
				check();
				break;
			case 'set':
				set();
				break;
			case 'modify':
				modify();
				break;
			case 'withering':
				withering();
				break;
			case 'delete':
			case 'remove':
				remove();
				break;
			case 'undo':
				undo();
				break;
			case 'redo':
				redo();
				break;
			case 'default':
				sendMessage('Not Recognized Command');
		}
	} catch (e) {
		sendMessage('INPUT ERROR');
	}
};

var diceHandler = function (params) {
	var msgParts = params.msg.toString().match(/\(([0-9].+?)\)/);
	var result;
	var firstPart;
	var remainder = '';
	var labelStart = 0;
	var diceCode = '';
	var target = params.target ? params.invokerid : cid;
	var msg = '';
	if (msgParts && params.invokerid !== clid) {
		if (msgParts[1].match(/[0-9]+?e/)) {
			result = exaltedDice(msgParts[1]);
		} else if (msgParts[1].match(/[0-9]+?w/)) {
			result = wodDice(msgParts[1]);
		} else if (msgParts[1].match(/[0-9]+?d/)) {
			result = baseDice(msgParts[1]);
		}
		if (result) {
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
			msg = remainder + '\n' + params.invokername +
				' rolling ' + diceCode + '\n' + result;
			cl.send('clientupdate', {clid: clid, client_nickname: firstPart}, function () {
				cl.send('sendtextmessage', {
					targetmode: params.targetmode, target: target, msg: msg
				}, function (err, response) {
					if (params.targetmode === 1 && target !== storyteller && storyteller !== undefined) {
						cl.send('sendtextmessage', {
							targetmode: 1, target: storyteller, msg: msg
						}, function (err, response) {
							cl.send('clientupdate', {clid: clid, client_nickname: 'Dice Roller'}, function () {});
						});
					} else {
						cl.send('clientupdate', {clid: clid, client_nickname: 'Dice Roller'}, function () {
						});
					}
				});
			});
		}
	}
};

cl.send('login', {client_login_name: uid, client_login_password: config.password}, function(err, response){
	console.log(err,response);
	cl.send('use', {sid: 1}, function(err, response){
		cl.send('whoami', function (err, response) {
			clid = response.client_id;
			cl.send('clientupdate', {clid: clid, client_nickname: 'Dice Roller'}, function (err, response) {
				cl.send('servernotifyregister', {event: 'textchannel', id:0}, function(err, response){
					cl.on('textmessage', function (params) {
						if (params.msg.match(/^!/)) {
							initiativeHandler(params);
						}
						else {
							diceHandler(params);
						}
					});
					keepAlive();
				});
				cl.send('servernotifyregister', {event: 'channel', id:0}, function(err, response){
					cl.on('channelcreated', function (params) {
						if (params.cpid === pid && cid === 1) {
							cl.send('clientmove', {clid: clid, cid: params.cid}, function () {
								cid = params.cid;
							});
						}
					});
				});
				cl.send('servernotifyregister', {event: 'textprivate', id:0}, function (err, response) {});
				cl.on('clientmoved', function (params) {
					if (params.ctid === cid) {
						welcome(params);
					}
				});
			});
			cl.send('channellist', function(err, response){
				response.forEach(function(channel){
					if (channel.channel_name === config.parent) {
						pid = channel.cid;
					}
					if (channel.channel_name.toLowerCase() === 'slow damnation' ||
						channel.channel_name.toLowerCase() === 'all dreams must end') {
						cl.send('clientmove', {clid: clid, cid: channel.cid}, function () {
							cid = channel.cid;
							cl.send('clientlist', {cid:cid}, function (err, response) {
								if (response) {
									if (response.forEach) {
										response.forEach(function (client) {
											welcome({clid: client.clid});
											welcome({clid: client.clid});
											if (client.client_nickname.toLowerCase() === 'storyteller' || client.client_nickname.toLowerCase() === 'lord of chaos') {
												storyteller = client.clid;
											}
										});
									} else {
										welcome({clid: response.clid});
										welcome({clid: response.clid});
										if (response.client_nickname.toLowerCase() === 'storyteller' || response.client_nickname.toLowerCase() === 'lord of chaos') {
											storyteller = response.clid;
										}
									}
								}
							});
						});
					}
				});
			});
		});
	});
});