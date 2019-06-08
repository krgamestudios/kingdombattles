export const STORE_PROFILE = 'STORE_PROFILE';
export const STORE_USERNAME = 'STORE_USERNAME';
export const STORE_GOLD = 'STORE_GOLD';
export const STORE_RECRUITS = 'STORE_RECRUITS';
export const STORE_SOLDIERS = 'STORE_SOLDIERS';
export const STORE_SPIES = 'STORE_SPIES';
export const STORE_SCIENTISTS = 'STORE_SCIENTISTS';
export const STORE_ACTIVE_BADGE = 'STORE_ACTIVE_BADGE';
export const STORE_ACTIVE_BADGE_FILENAME = 'STORE_ACTIVE_BADGE_FILENAME';
export const CLEAR_PROFILE = 'CLEAR_PROFILE';

export const storeProfile = (username, gold, recruits, soldiers, spies, scientists, activeBadge, activeBadgeFilename) => {
	return {
		type: STORE_PROFILE,
		username: username,
		gold: gold,
		recruits: recruits,
		soldiers: soldiers,
		spies: spies,
		scientists: scientists,
		activeBadge: activeBadge,
		activeBadgeFilename: activeBadgeFilename
	};
}

export const storeUsername = (username) => {
	return {
		type: STORE_USERNAME,
		username: username
	};
}

export const storeGold = (gold) => {
	return {
		type: STORE_GOLD,
		gold: gold
	};
}

export const storeRecruits = (recruits) => {
	return {
		type: STORE_RECRUITS,
		recruits: recruits
	};
}

export const storeSoldiers = (soldiers) => {
	return {
		type: STORE_SOLDIERS,
		soldiers: soldiers
	};
}

export const storeSpies = (spies) => {
	return {
		type: STORE_SPIES,
		spies: spies
	};
}

export const storeScientists = (scientists) => {
	return {
		type: STORE_SCIENTISTS,
		scientists: scientists
	};
}

export const storeActiveBadge = (activeBadge) => {
	return {
		tpye: STORE_ACTIVE_BADGE,
		activeBadge: activeBadge
	};
}

export const storeActiveBadgeFilename = (activeBadgeFilename) => {
	return {
		tpye: STORE_ACTIVE_BADGE,
		activeBadgeFilename: activeBadgeFilename
	};
}

export const clearProfile = () => {
	return {
		type: CLEAR_PROFILE
	};
}