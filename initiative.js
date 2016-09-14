var tracker = {};
var back = [];
var forward = [];
var output = '';
var currentActors = [];
var duelStep;
var cl;
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
			parts[1] = params.invokername.replace(/ /g,'');
		}
	}
	if (parts[2]) {
		if (parts[2].toLowerCase() === 'me' || parts[2].toLowerCase() === 'my') {
			parts[2] = params.invokername.replace(/ /g,'');
		}
	}
	var sendMessage = function (msg, name) {
		if (!name) {
			name = 'Initiative';
		}
		cl.send('clientupdate', {clid: clid, client_nickname: name}, function () {
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
	var duel = function () {
		var playera = parts[1];
		var playerb = parts[2];
		var aresult;
		var bresult;
		var name = 'Duel';
		sendMessage('Starting a duel between ' + playera + ' and ' + playerb, name);
		sendMessage('Each participant, roll Iaijutsu (Assessment) / Awareness vs TN 10+ opponent’s Insight Rank x 5. Success grants one piece of information, plus one per raise declared. If you beat your opponent’s roll by 10 or more, whether or not it gained any information, you gain +1k1 on your Focus Roll.', name);
		duelStep = function (invoker, label, result) {
			var message = '';
			if (invoker === playera || label.indexOf(playera) > -1) {
				console.log('Aresult set');
				aresult = result;
			}
			if (invoker === playerb || label.indexOf(playerb) > -1) {
				console.log('Bresult set');
				bresult = result;
			}
			if (aresult && bresult) {
				if (aresult >= (bresult + 10)) {
					message = playera + ' won by at least 10, so gains 1k1 to the next step.';
				} else if (bresult >= (aresult + 10)) {
					message = playerb + ' won by at least 10, so gains 1k1 to the next step.';
				}
				sendMessage(message, name);
				sendMessage('Each participant, make a contested Iaijutsu (Focus) / Void roll. If you win by 5 or more you strike first, for every 5 you beat your opponent you gain one free raise on the strike roll. If nobody wins by at least 5, it is a kharmic strike and both attack at once.', name);
				aresult = 0;
				bresult = 0;
				duelStep = function (invoker, label, result) {
					var message = '';
					if (invoker === playera || label.indexOf(playera) > -1) {
						aresult = result;
					}
					if (invoker === playerb || label.indexOf(playerb) > -1) {
						bresult = result;
					}
					if (aresult && bresult) {
						if (aresult >= (bresult + 5)) {
							message = playera + ' won by at least 5, so strikes first.';
							if (aresult - (bresult + 5) >= 5) {
								message += ' They also receive ' + Math.floor((aresult - (bresult + 5)) / 5) + ' free raises on the attack.';
							}
						} else if (bresult >= (aresult + 5)) {
							message = playerb + ' won by at least 5, so strikes first.';
							if (bresult - (aresult + 5) >= 5) {
								message += ' They also receive ' + Math.floor((bresult - (aresult + 5)) / 5) + ' free raises on the attack.';
							}
						} else {
							message = 'KHARMIC STRIKE!';
						}
						sendMessage(message,name);
						duelStep = undefined;
					}
				}
			}
		};
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
				if (actor.body > 0) {
					output += '[' + tracker[name].body + '|' + tracker[name].mood + ']';
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
			body: 0,
			mood: 0,
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
			if (actor.body > 0) {
				data += '[' + tracker[name].body + '|' + tracker[name].mood + ']';
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
		var output = tracker[name].initiative + ' ' + name + '('  + tracker[name].motes + '/' + tracker[name].maxmotes + ')' + ' [' + tracker[name].body + '|' + tracker[name].mood + ']';
		sendMessage(output);
	};
	var help = function () {
		var output = '\nreset\nnext\nadd NAME [INITIATIVE] [MAXMOTES]\nlist\ncheck NAME\nset NAME TRAIT VALUE\nmodify NAME TRAIT AMOUNT\nwithering ATTACKER DEFENDER AMOUNT\ndelete NAME\nundo\nredo\nduel [NAME1] [NAME2]\nhelp';
		sendMessage(output);
	};
	try {
		console.log(command);
		console.log(parts);
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
			case 'duel':
				duel();
				break;
			case 'default':
				sendMessage('Not Recognized Command');
		}
	} catch (e) {
		sendMessage('INPUT ERROR');
	}
};

module.exports = function(client) {
	cl = client;
	return initiativeHandler;
};