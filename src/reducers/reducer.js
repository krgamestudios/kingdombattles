import { combineReducers } from 'redux';
import { accountReducer } from './accounts.js';
import { combatReducer } from './combat.js';

//compile all reducers together
export default combineReducers({
	account: accountReducer,
/*	combat: combatReducer */
});

