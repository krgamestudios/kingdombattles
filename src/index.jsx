import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';

import DevTools from './dev_tools.jsx';
import App from './components/app.jsx';

import reducer from './reducers/reducer.js';

//persistence
let ITEM_NAME = 'account.kingdombattles';
let account = localStorage.getItem(ITEM_NAME);
account = account ? JSON.parse(account) : {};

var store = createStore(
	reducer,
	{ account: account }, //initial state
	applyMiddleware(thunk)
);

//persistence
store.subscribe(() => {
	localStorage.setItem(ITEM_NAME, JSON.stringify(store.getState().account));
});

//start the process
ReactDOM.render(
	<Provider store={store}>
		<App />
	</Provider>,
	document.querySelector("#root")
);
