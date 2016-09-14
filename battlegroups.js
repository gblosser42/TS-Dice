var roll = require('./dice').rawExaltedDice

/**
 * @param {{accuracy: number[], damage: number, overwhelming: number}}options
 * @constructor
 */
var Weapon = function (options) {
	var weap = this;
	weap.accuracy = options.accuracy;
	weap.damage = options.damage;
	weap.overwhelming = options.overwhelming;
};

/**
 * @param {{name: string, magnitude: number, melee: Weapon, ranged: Weapon, soak: number, size: number, training: string, morale: number, evasion: number, parry: number, might: number, command: string, specials: function[]}} options
 * @constructor
 */
var BattleGroup = function (options) {
	var bg = this;
	bg.magnitude = options.magnitude || 7;
	bg.mele = options.melee;
	bg.ranged = options.ranged;
	bg.soak = options.soak || 1;
	bg.size = options.size || 1;
	bg.training = options.training || 'poor';
	bg.morale = options.morale || 2;
	bg.evasion = options.evasion || 1;
	bg.parry = options.parry || 1;
	bg.defense = Math.max(bg.evasion,bg.parry);
	bg.might = options.might || 0;
	bg.command = options.command || '';
	bg.specials = options.specials || [];

	/**
	 * @param {BattleGroup} enemy
	 */
	bg.meleeAttack = function(enemy) {
		var cmdBonus = roll(bg.command);
	};

	bg.specials.forEach(function(special){
		if (typeof special === 'function') {
			special();
		}
	});
};