var roll = require('./dice').rawExaltedDice;

var output = function(text) {
	console.log(text);
};

/**
 * @param {{
 * accuracy: number[],
 * damage: number,
 * overwhelming: number,
 * auto: number}} options
 * @constructor
 */
var Weapon = function (options) {
	var weap = this;
	weap.accuracy = options.accuracy || 0;
	weap.damage = options.damage || 1;
	weap.overwhelming = options.overwhelming || 1;
	weap.auto = options.auto || 0;
};

/**
 * @param {{
 * name: string,
 * health: number,
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
 * might: number,
 * command: string,
 * specials: string[]}} options
 * @constructor
 */
var BattleGroup = function (options) {
	var bg = this;
	bg.name = options.name;
	bg.health = options.health || 7;
	bg.melee = options.melee;
	bg.ranged = options.ranged;
	bg.meleePool = options.meleePool;
	bg.rangedPool = options.rangedPool;
	bg.soak = options.soak || 1;
	bg.size = options.size || 1;
	bg.training = options.training || 'poor';
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
					var cmdBonus = bg.command ? roll(bg.command) : -1;
					var asuc = roll((cmdBonus + weapon.accuracy[range] + pool) + 'e+' + weapon.auto);
					var threshold = asuc - enemy.defense;
					output(cmdBonus + ' successes scored on the Command Roll');
					if (threshold >= 0) {
						output('HIT! ' + asuc + ' successes rolled aganst a defense of ' + enemy.defense + ', leaving ' + threshold + ' threshold successes');
						var damage = roll(Math.max(threshold + weapon.damage - enemy.soak, weapon.overwhelming) + 'e');
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

	bg.damaged = function(dam) {
		bg.magnitude -= dam;
		output(dam + ' damage inflicted on ' + bg.name + '! ' + bg.magnitude + ' magnitude remaining')
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
};


var specials = {
	unbreakable: function(bg) {
		bg.health += 2;
		bg.moraleCheck = function () {};
	}
};

var sword = new Weapon({
	accuracy: [2],
	damage: 10,
	overwhelming: 2
});

var javalin = new Weapon({
	accuracy: [3,1,-1],
	damage: 8,
	overwhelming: 1
});

var groupA = new BattleGroup({
	name: 'Legio X',
	health: 7,
	melee: sword,
	ranged: javalin,
	meleePool: 7,
	rangedPool: 8,
	soak: 6,
	size: 5,
	training: 'regular',
	morale: 6,
	evasion: 2,
	parry: 4,
	command: '6e'
});

var groupB = new BattleGroup({
	name: 'Legio IX',
	health: 7,
	melee: sword,
	ranged: javalin,
	meleePool: 7,
	rangedPool: 8,
	soak: 6,
	size: 5,
	training: 'regular',
	morale: 6,
	evasion: 2,
	parry: 4,
	command: '6e',
	specials: ['unbreakable']
});