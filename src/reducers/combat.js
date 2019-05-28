import { SET_ATTACK_DISABLED } from '../actions/combat.js';

const initialStore = {
	attackDisabled: true
};

export function combatReducer(store = initialStore, action) {
	switch(action.type) {
		case SET_ATTACK_DISABLED: {
			let newStore = JSON.parse(JSON.stringify(initialStore));
			newStore.attackDisabled = action.disabled;
			return newStore;
		}

		default:
			return store;
	}
}