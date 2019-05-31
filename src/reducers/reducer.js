import { combineReducers } from 'redux';
import { accountReducer } from './account.js';
import { profileReducer } from './profile.js';

//compile all reducers together
export default combineReducers({
	account: accountReducer,
	profile: profileReducer
});

