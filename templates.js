var weapons = require('./weapons');

module.exports = {
	'conscript': {
		strength: 2,
		melee: weapons.medium_melee,
		ranged: weapons.light_thrown,
		meleePool: 3,
		rangedPool: 4,
		soak: 5,
		morale: 4,
		evasion: 2,
		parry: 3,
		might: 0
	},
	'medium infantry': {
		strength: 3,
		melee: weapons.medium_melee,
		ranged: weapons.medium_thrown,
		meleePool: 6,
		rangedPool: 5,
		soak: 8,
		morale: 6,
		evasion: 2,
		parry: 4,
		might: 0
	}
};