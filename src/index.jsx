import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';

import DevTools from './dev_tools.jsx';
import App from './components/app.jsx';

import reducer from './reducers/reducer.jsx';

var store = createStore(
	reducer,
	{}, //initial state
	compose(
		applyMiddleware(thunk),
		DevTools.instrument()
	)
);

//start the process
ReactDOM.render(
	<Provider store={store}>
		<div>
			<App />
			<DevTools />
		</div>
	</Provider>,
	document.querySelector("#root")
);
