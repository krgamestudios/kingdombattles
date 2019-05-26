import React from 'react';
import { BrowserRouter, Switch, Route } from 'react-router-dom';

//include pages
import Home from './pages/home.jsx';
import Signup from './pages/signup.jsx';
import Login from './pages/login.jsx';
import PasswordChange from './pages/password_change.jsx';
import PasswordRecover from './pages/password_recover.jsx';
import PasswordReset from './pages/password_reset.jsx';

import Profile from './pages/profile.jsx';
import Ladder from './pages/ladder.jsx';

import PageNotFound from './pages/page_not_found.jsx';

//other stuff
import Footer from './panels/footer.jsx';

export default class App extends React.Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	render() {
		return (
			<div className = 'central'>
				<img className='banner' src={'/img/flag_scaled.png'} />
				<BrowserRouter>
					<Switch>
						<Route exact path='/' component={Home} />
						<Route path='/signup' component={Signup} />
						<Route path='/login' component={Login} />
						<Route path='/passwordchange' component={PasswordChange} />
						<Route path='/passwordrecover' component={PasswordRecover} />
						<Route path='/passwordreset' component={PasswordReset} />

						<Route path='/profile' component={Profile} />
						<Route path='/ladder' component={Ladder} />

						<Route path='*' component={PageNotFound} />
					</Switch>
				</BrowserRouter>
				<Footer />
			</div>
		);
	}
}