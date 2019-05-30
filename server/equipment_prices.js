let weapons = [
	{ name: 'Stick', cost: 50, boost: 0.02, level: 1 },
	{ name: 'Dagger', cost: 75, boost: 0.03, level: 2 },
	{ name: 'Sword', cost: 100, boost: 0.04, level: 3 },
	{ name: 'Longsword', cost: 150, boost: 0.05, level: 4 },
	{ name: 'Frying Pan', cost: 200, boost: 0.06, level: 5 },
];

let armour = [
	{ name: 'leather', cost: 75, boost: 0.02, level: 2 },
	{ name: 'gambeson', cost: 100, boost: 0.03, level: 3 },
	{ name: 'chainmail', cost: 150, boost: 0.04, level: 4 },
	{ name: 'platemail', cost: 200, boost: 0.05, level: 5 },
];

module.exports = {
	weapons: weapons,
	armour: armour
};