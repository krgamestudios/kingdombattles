import {
	STORE_PROFILE,
	STORE_USERNAME,
	STORE_GOLD,
	STORE_RECRUITS,
	STORE_SOLDIERS,
	STORE_SPIES,
	STORE_SCIENTISTS,
	STORE_ACTIVE_BADGE,
	STORE_ACTIVE_BADGE_FILENAME,
	CLEAR_PROFILE
} from '../actions/profile.js';

const initialStore = {
	username: '',
	gold: 0,
	recruits: 0,
	soldiers: 0,
	spies: 0,
	scientists: 0,
	activeBadge: '',
	activeBadgeFilename: ''
};

export const profileReducer = (store = initialStore, action) => {
	let newStore = JSON.parse(JSON.stringify(store));

	switch(action.type) {
		case STORE_PROFILE:
			newStore.username = action.username;
			newStore.gold = action.gold;
			newStore.recruits = action.recruits;
			newStore.soldiers = action.soldiers;
			newStore.spies = action.spies;
			newStore.scientists = action.scientists;
			newStore.activeBadge = action.activeBadge;
			newStore.activeBadgeFilename = action.activeBadgeFilename;
		break;

		case STORE_USERNAME:
			newStore.username = action.username;
		break;

		case STORE_GOLD:
			newStore.gold = action.gold;
		break;

		case STORE_RECRUITS:
			newStore.recruits = action.recruits;
		break;

		case STORE_SOLDIERS:
			newStore.soldiers = action.soldiers;
		break;

		case STORE_SPIES:
			newStore.spies = action.spies;
		break;

		case STORE_SCIENTISTS:
			newStore.scientists = action.scientists;
		break;

		case STORE_ACTIVE_BADGE:
			newStore.activeBadge = action.activeBadge;
		break;

		case STORE_ACTIVE_BADGE_FILENAME:
			newStore.activeBadgeFilename = action.activeBadgeFilename;
		break;

		case CLEAR_PROFILE:
			newStore = JSON.parse(JSON.stringify(initialStore));
		break;
	};

	return newStore;
}