const users = {
	987654321: {
		currentSection: 0,
		flowCurrent: '',
	},
};
const saveCurretSection = (number, flowLength) => {
	let user = users[number];
	if (user) {
		if (user.currentSection >= flowLength - 1) {
			user.currentSection = 0;
			user.flowCurrent = '';
			return;
		}
		user.currentSection = user.currentSection + 1;
	} else {
		users[number] = { currentSection: 0, flowCurrent: '' };
	}
	// return users
};
const stableCurrent = (number) => {
	let user = users[number];

	if (user == undefined) {
		users[number] = { currentSection: 0, flowCurrent: '' };
	}
};
const getCurrent = (number) => {
	let user = users[number];
	return user;
};

module.exports = { saveCurretSection, stableCurrent, getCurrent };
