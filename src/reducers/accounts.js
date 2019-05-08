import { LOGIN, LOGOUT, SESSIONCHANGE } from "../actions/accounts.js";

const initialStore = {
	id: 0,
	email: '',
	username: '',
	token: 0
};

export function accountReducer(store = initialStore, action) {
	switch(action.type) {
		case LOGIN: {
			let newStore = JSON.parse(JSON.stringify(initialStore));

			newStore.id = action.id;
			newStore.email = action.email;
			newStore.username = action.username;
			newStore.token = action.token;

			return newStore;
		}

		case LOGOUT:
			return initialStore;

		case SESSIONCHANGE: {
			let newStore = JSON.parse(JSON.stringify(store));

			newStore.token = action.token;

			return newStore;
		}

		default:
			return store;
	}
}

