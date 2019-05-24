import React from 'react';
import { BrowserRouter, Switch, Route } from 'react-router-dom';

//include pages
import Home from './pages/home.jsx';
import Profile from './pages/profile.jsx';
import Ladder from './pages/ladder.jsx';
import PasswordReset from './pages/password_reset.jsx'
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
				<BrowserRouter>
					<Switch>
						<Route exact path='/' component={Home} />
						<Route path='/profile' component={Profile} />
						<Route path='/ladder' component={Ladder} />
						<Route path='/passwordreset' component={PasswordReset} />
						<Route path='*' component={PageNotFound} />
					</Switch>
				</BrowserRouter>
				<Footer />
			</div>
		);
	}
}