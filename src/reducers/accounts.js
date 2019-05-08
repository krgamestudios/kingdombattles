import { LOGIN, LOGOUT } from "../actions/accounts.js";

const initialStore = {
	id: 0,
	email: '',
	username: '',
	token: 0
};

export function accountReducer(store = initialStore, action) {
	switch(action.type) {
		case LOGIN:
			let newStore = JSON.parse(JSON.stringify(initialStore));

			newStore.id = action.id;
			newStore.email = action.email;
			newStore.username = action.username;
			newStore.token = action.token;

			return newStore;

		case LOGOUT:
			return initialStore;

		default:
			return store;
	}
}

