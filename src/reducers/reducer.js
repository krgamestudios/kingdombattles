import { combineReducers } from 'redux';
import { accountReducer } from './accounts.js';

//compile all reducers together
export default combineReducers({
	account: accountReducer
});

