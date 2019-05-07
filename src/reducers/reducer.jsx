import { ACTION_NAME } from "../actions/actions.jsx";

const initialState = {};

export default function reducer(state = initialState, action) {
	switch(action.type) {
		case ACTION_NAME:
			//DO NOTHING
			return state;

		default:
			return state;
	}
}