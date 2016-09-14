var exaltedDice = function (message) {
	rawExaltedDice(message, function (successes,sucDice,builder) {
		return builder + '\n' + '[b]SUCCESSES: ' + successes + '(' + sucDice + ')[/b]';
	});
};

var rawExaltedDice = function (message, callback) {
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
	if (typeof callback === 'function') {
		callback(successes,sucDice,builder);
	} else {
		return successes;
	}
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
	var dice;
	var diceSize;
	var total = 0;
	var builder = '';
	var result;
	var parts = message.split('+')
	parts.forEach(function(part, index){
		dice = part.match(/([0-9]+)d([0-9]+)/);
		if (dice) {
			diceSize = parseInt(dice[2], 10);
			dice = parseInt(dice[1], 10);
		} else {
			dice = 0;
			total += parseInt(part);
		}
		while (dice > 0) {
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
			if (dice > 0 || index < parts.length - 1) {
				builder += ',';
			}
		}
	});

	return builder + '\n' + '[b]TOTAL: ' + total + '[/b]';
};

var pokeDice = function (message) {
	var damage = message.match(/([0-9]+)p/);
	var damageTable = {
		1: '1d6+1',
		15: '4d10+20',
		2: '1d6+3',
		16: '5d10+20',
		3: '1d6+5',
		17: '5d12+25',
		4: '1d8+6',
		18: '6d12+25',
		5: '1d8+8',
		19: '6d12+30',
		6: '2d6+8',
		20: '6d12+35',
		7: '2d6+10',
		21: '6d12+40',
		8: '2d8+10',
		22: '6d12+45',
		9: '2d10+10',
		23: '6d12+50',
		10: '3d8+10',
		24: '6d12+55',
		11: '3d10+10',
		25: '6d12+60',
		12: '3d12+10',
		26: '7d12+65',
		13: '4d10+10',
		27: '8d12+70',
		14: '4d10+15',
		28: '8d12+80'
	};
	if (damage) {
		damage = parseInt(damage[1], 10);
	} else {
		damage = 1;
	}
	damage = damageTable[damage];

	return damage + ': ' + baseDice(damage);;
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

var l5rDice = function (message, name, label) {
	var dice = message.match(/([0-9]+)k/);
	var keep = message.match(/k([0-9]+)/);
	var explode = message.match(/e([0-9]+)/);
	var reroll = message.match(/r([0-9]+)/);
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
	if (reroll) {
		reroll = reroll[1];
	} else {
		reroll = '';
	}
	if (auto) {
		auto = parseInt(auto[0], 10);
	} else {
		auto = 0;
	}
	while (dice > 0) {
		total = 0;
		do {
			result = Math.floor(Math.random() * 10);
			if (reroll.indexOf(result.toString()) > -1) {
				result = Math.floor(Math.random() * 10);
			}
			if (result === 0) {
				result = 10;
			}
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

module.exports = {
	rawExaltedDice: rawExaltedDice,
	exaltedDice: exaltedDice,
	wodDice: wodDice,
	baseDice: baseDice,
	pokeDice: pokeDice,
	shadowrunDice: shadowrunDice,
	l5rDice: l5rDice
};