var roll = require('./dice').rawExaltedDice;
var weapons = require('./weapons');
var templates = require('./templates');

String.prototype.capitalizeFirstLetter = function() {
	return this.charAt(0).toUpperCase() + this.slice(1);
};

var specials = {
	unbreakable: function(bg) {
		bg.health += 3;
		bg.moraleCheck = function () {
			output(bg.name + ' is FEARLESS!');
		};
	},
	balanced: function(bg) {
		bg.melee.overwhelming++;
	},
	crossbow: function(bg) {
		bg.ranged.damage += (4 - bg.strength);
	},
	monster: function(bg) {
		bg.fleeCheck = function () {
			if (bg.isAlive && bg.isRouting) {
				bg.isAlive = false;
				output(bg.name + ' has stampeded off the field!');
				battleGroups.forEach(function(group){
					if(group.isAlive) {
						bg.meleeAttack(group);
					}
				});
			}
		}
	}
};

var	battleGroups = [];

var output = function(text) {
	console.log(text);
};

/**
 * @param {{
 * name: string,
 * [health]: number,
 * strength: number
 * melee: Weapon,
 * ranged: Weapon,
 * meleePool: number,
 * rangedPool: number,
 * soak: number,
 * size: number,
 * training: string,
 * morale: number,
 * evasion: number,
 * parry: number,
 * [might]: number,
 * [command]: number,
 * [specials]: string[]}} options
 * @constructor
 */
var BattleGroup = function (options) {
	var bg = this;
	bg.name = options.name;
	bg.health = options.health || 7;
	bg.strength = options.strength || 1;
	bg.melee = options.melee;
	bg.ranged = options.ranged;
	bg.meleePool = options.meleePool;
	bg.rangedPool = options.rangedPool;
	bg.soak = options.soak || 1;
	bg.size = options.size || 1;
	bg.training = options.training.toLowerCase() || 'poor';
	bg.morale = options.morale || 2;
	bg.moraleDifficulty = 1;
	bg.evasion = options.evasion || 1;
	bg.parry = options.parry || 1;
	bg.defense = Math.max(bg.evasion,bg.parry);
	bg.might = options.might || 0;
	bg.command = options.command || '';
	bg.magnitude = bg.health + bg.size;
	bg.isAlive = true;
	bg.isRouting = false;
	bg.specials = options.specials || [];


	/**
	 *
	 * @param {BattleGroup} enemy
	 * @param {Weapon} weapon
	 * @param {number} range
	 * @param {number} pool
	 */
	bg.attack = function(enemy, weapon, range, pool) {
		if (bg.isAlive) {
			if (enemy.isAlive) {
				if (!bg.isRouting) {
					var cmdBonus = bg.command ? bg.command : -1;
					if (cmdBonus !== -1) {
						if (bg.training === 'poor') {
							cmdBonus -= 2;
						} else if (bg.training === 'elite') {
							cmdBonus += 2;
						}
						if (cmdBonus > 0) {
							cmdBonus = roll(cmdBonus + 'e');
							output(cmdBonus + ' successes scored on the Command Roll');
						}
					}
					var asuc = roll((Math.max(cmdBonus,0) + weapon.accuracy[range] + pool + bg.size + bg.might) + 'e+' + weapon.auto);
					var defense = enemy.defense;
					if (enemy.training === 'average') {
						defense += 1;
					} else if (enemy.training === 'elite') {
						defense += 2;
					}
					if (enemy.might > 0) {
						defense += 1;
					}
					if (enemy.might > 2) {
						defense += 1;
					}
					var threshold = asuc - defense;
					if (threshold >= 0) {
						output('HIT! ' + asuc + ' successes rolled aganst a defense of ' + defense + ', leaving ' + threshold + ' threshold successes');
						var damage = roll(Math.max(threshold + bg.strength + weapon.damage + bg.might + bg.size - enemy.soak - enemy.size, weapon.overwhelming) + 'e');
						enemy.damaged(damage);
					} else {
						output('Miss! ' + asuc + ' successes rolled aganst a defense of ' + enemy.defense + '.');
					}
				} else {
					output(bg.name + ' is routing and cannot attack!');
				}
			} else {
				output(enemy.name + ' is already dead!');
			}
		} else {
			output(bg.name + ' is dead and cannot attack!');
		}
	};

	/**
	 * @param {BattleGroup} enemy
	 */
	bg.meleeAttack = function(enemy) {
		bg.attack(enemy, bg.melee, 0, bg.meleePool);
	};

	/**
	 * @param {BattleGroup} enemy
	 * @param {number} range
	 */
	bg.rangedAttack = function(enemy, range) {
		bg.attack(enemy, bg.ranged, range, bg.rangedPool);
	};

	bg.moraleCheck = function() {
		var moraleResult;
		var difficulty;
		var outcome = 'passed';
		moraleResult = roll(bg.morale + 'e');
		difficulty = bg.moraleDifficulty + (bg.training === 'poor' ? 1 : 0);
		if (moraleResult < difficulty) {
			bg.isRouting = true;
			outcome = 'failed'
		}
		output(bg.name + ' ' + outcome + ' a morale check scoring ' + moraleResult + ' successes against a difficulty of ' + difficulty)
	};

	bg.fleeCheck = function() {
		if (bg.isAlive && bg.isRouting) {
			bg.isAlive = false;
			output(bg.name + ' has fled the field!');
		}
	};

	bg.damaged = function(dam) {
		bg.magnitude -= dam;
		output(dam + ' damage inflicted on ' + bg.name + '! ' + bg.magnitude + ' magnitude remaining');
		while (bg.magnitude <= 0 && bg.size > 0) {
			bg.size--;
			if (bg.size <= 0) {
				bg.isAlive = false;
				output(bg.name + ' is destroyed!');
			}
			if (bg.isAlive) {
				bg.magnitude = bg.magnitude + bg.health + bg.size;
				output(bg.name + ' lost a point of size! Current size: ' + bg.size);
				if (!bg.isRouting) {
					bg.moraleCheck();
					bg.moraleDifficulty++;
				}
			}
		}
	};

	bg.specials.forEach(function(special){
		if (typeof specials[special] === 'function') {
			specials[special](bg);
		}
	});

	bg.output = function () {
		var builder = '[b]' + bg.name + '[b] -- Size: {SIZE} Magnitude: {MAGNITUDE} Defense: {DEFENSE}  Soak: {SOAK} Morale: {MORALE} Melee: {ACCURACY}|{DAMAGE} Ranged: {RACC}|{RDAM} Training: {TRAINING} Might: {MIGHT}'

		var soak = bg.soak + bg.size;
		builder = builder.replace('{SOAK}', ''+soak);

		var defense = bg.defense;
		if (bg.training === 'average') {
			defense += 1;
		} else if (bg.training === 'elite') {
			defense += 2;
		}
		if (bg.might > 0) {
			defense += 1;
		}
		if (bg.might > 2) {
			defense += 1;
		}
		builder = builder.replace('{DEFENSE}', ''+defense);

		Object.keys(bg).forEach(function(key){
			var val = bg[key];
			if (typeof val === 'string') {
				val = val.capitalizeFirstLetter();
			}
			builder=builder.replace('{' + key.toUpperCase() + '}', val);
		});

		builder = builder.replace('{ACCURACY}', ''+(bg.meleePool + bg.melee.accuracy[0] + bg.size + bg.might));

		builder = builder.replace('{RACC}', (bg.rangedPool + bg.ranged.accuracy[0] + bg.size + bg.might) + '/' + (bg.rangedPool + bg.ranged.accuracy[1] + bg.size + bg.might));

		builder = builder.replace('{DAMAGE}', (bg.strength + bg.melee.damage + bg.size + bg.might));

		builder = builder.replace('{RDAM}', (bg.strength + bg.ranged.damage + bg.size + bg.might));

		if (bg.specials.length > 0) {
			builder += ' Specials: ' + bg.specials.join(',');
		}

		output(builder);
	};

	battleGroups.push(bg);
};

/**
 * @param {string} temp
 * @param {string} name
 * @param {number} size
 * @param {string} training
 * @param {number} [command]
 * @param {object} [overrides]
 */
var fromTemplate = function(temp, name, size, training, command, overrides) {
	var template =JSON.parse(JSON.stringify(templates[temp]));
	template.name = name;
	template.size = size;
	template.training = training;
	template.command = command;
	if (overrides) {
		Object.keys(overrides).forEach(function (key) {
			template[key] = overrides[key];
		});
	}
	return new BattleGroup(template);
};

var farmers = fromTemplate('conscript', 'FARMERS', 4, 'elite', 0, {specials:['balanced','fearless']});

farmers.output();

module.exports.BattleGroup = BattleGroup;
module.exports.template = fromTemplate;