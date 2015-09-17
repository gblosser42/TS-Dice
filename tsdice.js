'use strict';
var Client = require('node-teamspeak');

/**
  * @type {{server: string, username: string, password: string, parent: string}}
 */
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
var currentActors = [];

var exaltedDice = function (message) {
	var dice = message.match(/([0-9]+)e/);
	var double = message.match(/[ed]([0-9]+)/);
	var reroll = message.match(/r([0-9]+)/);
	var target = message.match(/t([0-9]+)/);
	var auto = message.match(/(\+|-)([0-9]+)/);
	var count = message.match(/c([0-9]+)/);
	var cascade = message.match(/!/);
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
			if (cascade) {
				dice += 1;
			}
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

var shadowrunDice = function (message) {
	var dice = message.match(/([0-9]+)s/);
	var edge = message.match(/e/);
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
	if (auto) {
		auto = parseInt(auto[0], 10);
	} else {
		auto = 0;
	}
	while (dice > 0) {
		result = Math.floor(Math.random() * 6);
		if (result === 0) {
			result = 6;
		}
		if (result >= 5) {
			successes += 1;
		}
		if (result === 6 && !!edge) {
			dice += 1;
			sucDice += 1;
		}
		if (result === 1) {
			builder += '[b][color=Red]' + result + '[/color][/b]';
		} else if (result >= 6) {
			builder += '[b][color=Green]' + result + '[/color][/b]';
		} else  if (result >= 5) {
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

var l5rDice = function (message) {
	var dice = message.match(/([0-9]+)k/);
	var keep = message.match(/k([0-9]+)/);
	var explode = message.match(/e([0-9]+)/);
	var auto = message.match(/(\+|-)([0-9]+)/);
	var results = [];
	var total = 0;
	var final = 0;
	var highest = 0;
	var highIndex = 0;
	var result;
	var builder = '';
	if (dice) {
		dice = parseInt(dice[1], 10);
	} else {
		dice = 0;
	}
	if (keep) {
		keep = parseInt(keep[1], 10);
	} else {
		keep = 1;
	}
	if (explode) {
		explode = parseInt(explode[1], 10);
	} else {
		explode = 10;
	}
	if (auto) {
		auto = parseInt(auto[0], 10);
	} else {
		auto = 0;
	}
	while (dice > 0) {
		total = 0;
		do {
			result = Math.floor(Math.random() * 10) + 1;
			total += result;
		} while (result >= explode);
		results.push(total);
		dice -= 1;
		if (dice > 0) {
			builder += ',';
		}
	}
	while (keep > 0) {
		highest = 0;
		highIndex = 0;
		results.forEach(function (res, index) {
			if (res > highest) {
				highest = res;
				highIndex = index;
			}
		});
		final += highest;
		if (highest >= explode) {
			results[highIndex] = '[b]' + results[highIndex] + '[/b]';
		}
		results[highIndex] = '[color=Green]' + results[highIndex] + '[/color]';
		keep -= 1;
	}
	final += auto;
	builder = results.join(',');
	return builder + '\n' + '[b]TOTAL: ' + final + '[/b]';
};

var keepAlive = function () {
	cl.send('channellist', function(){
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

/**
 * @param {{invokername: string, msg: string}} params
 */
var initiativeHandler = function (params) {
	var raw = params.msg.substr(1);
	var parts = raw.split(' ');
	var command = parts[0];
	var highest = -9999999;
	if (parts[1]) {
		if (parts[1].toLowerCase() === 'me' || parts[1].toLowerCase() === 'my') {
			parts[1] = params.invokername;
		}
	}
	var sendMessage = function (msg) {
		cl.send('clientupdate', {clid: clid, client_nickname: 'Initiative'}, function () {
			cl.send('sendtextmessage', {
				targetmode: 2, msg: msg
			}, function () {
				cl.send('clientupdate', {clid: clid, client_nickname: 'Dice Roller'}, function () {});
			});
		});
	};
	var decodeInitiative = function (str) {
		if (parseInt(str,10).toString() !== 'NaN') {
			return parseInt(str,10);
		} else {
			str = str.replace(/\[b]/g,'').replace(/\[i]/g,'');
			return parseInt(str,10);
		}
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
		var active = [];
		var oldActors = [];
		Object.keys(tracker).forEach(function (actor) {
			actor = tracker[actor];
			if (!actor.acted) {
				if (actor.initiative > highest) {
					highest = actor.initiative;
					active = [actor];
					oldActors = [JSON.parse(JSON.stringify(actor))];
				} else if (actor.initiative === highest) {
					active.push(actor);
					oldActors.push(JSON.parse(JSON.stringify(actor)));
				}
			}
		});
		if (active.length > 0) {
			currentActors = active;
			output = highest + ':';
			active.forEach(function (actor) {
				actor.acted = true;
				actor.motes = Math.min(actor.motes+5,actor.maxmotes);
				output += ' ' + actor.name;
				if (actor.maxmotes > 0) {
					output += '('  + actor.motes + '/' + actor.maxmotes + ')';
				}
				 output += ',';
			});
			output = output.replace(/,$/, '');
			sendMessage(output);
			back.push(function (un) {
				if (un === 'undo') {
					active.forEach(function (actor, index) {
						actor.acted = false;
						actor.motes = oldActors[index].motes;
					});
					sendMessage('Undoing next turn');
				} else {
					active.forEach(function (actor) {
						actor.acted = true;
						actor.motes = Math.min(actor.motes+5,actor.maxmotes);
					});
					sendMessage('Redoing next turn');
				}
			});
		} else {
			sendMessage('NEW TURN');
			currentActors = [];
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
			motes: parseInt(parts[3], 10) || 0,
			maxmotes: parseInt(parts[3], 10) || 0,
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
			var actor = tracker[name];
			var data = '';
			var isActive = false;
			currentActors.forEach(function(act){
				if (act.name === actor.name) {
					isActive = true;
				}
			});
			if (isActive) {
				data += '[b]';
			} else if (actor.acted) {
				data += '[i]';
			}
			data += actor.initiative + ' ' + name;
			if (actor.maxmotes > 0) {
				data += '('  + actor.motes + '/' + actor.maxmotes + ')';
			}
			if (isActive) {
				data += '[/b]';
			} else if (actor.acted) {
				data += '[/i]';
			}
			output.push(data);
		});
		output.sort(function (a, b) { return decodeInitiative(b.split(' ')[0]) - decodeInitiative(a.split(' ')[0]) });
		output.forEach(function (val) {
			toPrint += val + '\n';
		});
		sendMessage('\n' + toPrint.replace(/\n$/, ''));
	};
	var set = function () {
		var trait = parts[2].toLowerCase() === 'init' ? 'initiative' : parts[2].toLowerCase();
		var oldValue = tracker[parts[1]][trait];
		var newValue = parseInt(parts[3], 10);
		var name = parts[1];
		tracker[name][trait] = newValue;
		back.push(function (un) {
			if (un==='undo') {
				tracker[name][trait] = oldValue;
				sendMessage('Reset ' + name + '\'s ' + trait + ' to ' + oldValue);
			} else {
				tracker[name][trait] = newValue;
				sendMessage('Re-set ' + name + '\'s ' + trait + ' to ' + newValue);
			}
		});
	};
	var modify = function () {
		var trait = parts[2].toLowerCase() === 'init' ? 'initiative' : parts[2].toLowerCase();
		var oldValue = tracker[parts[1]][trait];
		var newValue = oldValue + parseInt(parts[3], 10);
		var name = parts[1];
		tracker[name][trait] = newValue;
		back.push(function (un) {
			if (un==='undo') {
				tracker[name][trait] = oldValue;
				sendMessage('Reset ' + name + '\'s ' + trait + ' to ' + oldValue);
			} else {
				tracker[name][trait] = newValue;
				sendMessage('Re-set ' + name + '\'s ' + trait + ' to ' + newValue);
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
		if (defenderNewValue <= 0 && defenderOldValue > 0) {
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
		var output = tracker[name].initiative + ' ' + name + '('  + tracker[name].motes + '/' + tracker[name].maxmotes + ')';
		sendMessage(output);
	};
	var help = function () {
		var output = '\nreset\nnext\nadd NAME [INITIATIVE] [MAXMOTES]\nlist\ncheck NAME\nset NAME TRAIT VALUE\nmodify NAME TRAIT AMOUNT\nwithering ATTACKER DEFENDER AMOUNT\ndelete NAME\nundo\nredo\nhelp';
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
			case 'help':
				help();
				break;
			case 'default':
				sendMessage('Not Recognized Command');
		}
	} catch (e) {
		sendMessage('INPUT ERROR');
	}
};

/**
 * @param {{target: string, invokerid: number, msg: string, invokername: string, targetmode: number}} params
 */
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
		if (msgParts[1].match(/^[0-9]+?e/)) {
			result = exaltedDice(msgParts[1]);
		} else if (msgParts[1].match(/^[0-9]+?w/)) {
			result = wodDice(msgParts[1]);
		} else if (msgParts[1].match(/^[0-9]+?d/)) {
			result = baseDice(msgParts[1]);
		} else if (msgParts[1].match(/^[0-9]+?s/)) {
			result = shadowrunDice(msgParts[1]);
		} else if (msgParts[1].match(/^[0-9]+?k/)) {
			result = l5rDice(msgParts[1]);
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
				}, function () {
					if (params.targetmode === 1 && target !== storyteller && storyteller !== undefined) {
						cl.send('sendtextmessage', {
							targetmode: 1, target: storyteller, msg: msg
						}, function () {
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

cl.send('login', {client_login_name: uid, client_login_password: config.password},
	/**
	 * @param err
	 * @param {{client_id: number}}response
	 */
	function(err, response){
	console.log(err,response);
	cl.send('use', {sid: 1}, function(){
		cl.send('whoami', function (err, response) {
			clid = response.client_id;
			cl.send('clientupdate', {clid: clid, client_nickname: 'Dice Roller'}, function () {
				cl.send('servernotifyregister', {event: 'textchannel', id:0}, function(){
					cl.on('textmessage', function (params) {
						if (params.msg) {
							if (params.msg.toString().match(/^!/)) {
								initiativeHandler(params);
							}
							else {
								diceHandler(params);
							}
						}
					});
					keepAlive();
				});
				cl.send('servernotifyregister', {event: 'channel', id:0}, function(){
					cl.on('channelcreated',
						/**
						 * @param {{cpid: number, cid: number}} params
						 */
						function (params) {
						if (params.cpid === pid && cid === 1) {
							cl.send('clientmove', {clid: clid, cid: params.cid}, function () {
								cid = params.cid;
							});
						}
					});
				});
				cl.send('servernotifyregister', {event: 'textprivate', id:0}, function (err, response) {});
				cl.on('clientmoved',
					/**
					 * @param {{ctid: number}}params
					 */
					function (params) {
					if (params.ctid === cid) {
						welcome(params);
					}
				});
				cl.send('channellist', function(err, response){
					response.forEach(
						/**
						 * @param {{channel_name: string, cid: number}}channel
						 */
						function(channel){
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
});