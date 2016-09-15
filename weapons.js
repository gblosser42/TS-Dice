/**
 * @param {{
 * accuracy: number[],
 * damage: number,
 * overwhelming: number,
 * [auto]: number}} options
 * @constructor
 */
var Weapon = function (options) {
	var weap = this;
	weap.accuracy = options.accuracy || 0;
	weap.damage = options.damage || 1;
	weap.overwhelming = options.overwhelming || 1;
	weap.auto = options.auto || 0;
};

module.exports = {
	light_melee: new Weapon({
		accuracy: [4],
		damage: 7,
		overwhelming: 1
	}),
	medium_melee: new Weapon({
		accuracy: [2],
		damage: 9,
		overwhelming: 1
	}),
	heavy_melee: new Weapon({
		accuracy: [0],
		damage: 11,
		overwhelming: 1
	}),
	light_archery: new Weapon({
		accuracy: [-2,4,2,0,-2],
		damage: 7,
		overwhelming: 1
	}),
	medium_archery: new Weapon({
		accuracy: [-2,4,2,0,-2],
		damage: 9,
		overwhelming: 1
	}),
	heavy_archery: new Weapon({
		accuracy: [-2,4,2,0,-2],
		damage: 11,
		overwhelming: 1
	}),
	light_thrown: new Weapon({
		accuracy: [4,3,2,-1,-3],
		damage: 7,
		overwhelming: 1
	}),
	medium_thrown: new Weapon({
		accuracy: [4,3,2,-1,-3],
		damage: 9,
		overwhelming: 1
	})
};