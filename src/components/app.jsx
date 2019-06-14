import React from 'react';
import { BrowserRouter, Switch, Route } from 'react-router-dom';
import Loadable from 'react-loadable';

//other stuff
import Footer from './panels/footer.jsx';
import GA from './utilities/google_analytics.jsx';

//lazy route loading (with error handling)
const LazyRoute = (props) => {
	const component = Loadable({
		loader: props.component,

		loading: (props) => {
			if (props.error) {
				return (
					<div className='page'>
						<div className='warning' style={{display: 'flex'}}>
							<p className='centered'>{props.error}</p>
						</div>
					</div>
				);
			} else if (props.timedOut) {
				return (
					<div className='page'>
						<div className='warning' style={{display: 'flex'}}>
							<p className='centered'>Timed Out</p>
						</div>
					</div>
				);
			} else if (props.pastDelay) {
				return (
					<div className='page'>
						<p className='centered'>Loading...</p>
					</div>
				);
			} else {
				return null;
			}
		},
		timeout: 10000
	});

	return <Route {...props} component={component} />;
};

//the app class
export default class App extends React.Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	render() {
		return (
			<div className = 'central'>
				<a className='banner' href='/'><img src={'/img/flag_scaled.png'} /></a>
				<BrowserRouter>
					{ GA.init() && <GA.RouteTracker /> }
					<Switch>
						<LazyRoute exact path='/' component={() => import('./pages/home.jsx')} />

						<LazyRoute path='/signup' component={() => import('./pages/signup.jsx')} />
						<LazyRoute path='/login' component={() => import('./pages/login.jsx')} />
						<LazyRoute path='/passwordchange' component={() => import('./pages/password_change.jsx')} />
						<LazyRoute path='/passwordrecover' component={() => import('./pages/password_recover.jsx')} />
						<LazyRoute path='/passwordreset' component={() => import('./pages/password_reset.jsx')} />

						<LazyRoute path='/profile' component={() => import('./pages/profile.jsx')} />
						<LazyRoute path='/equipment' component={() => import('./pages/equipment.jsx')} />
						<LazyRoute path='/ladder' component={() => import('./pages/ladder.jsx')} />
						<LazyRoute path='/combatlog' component={() => import('./pages/combat_log.jsx')} />
						<LazyRoute path='/spyinglog' component={() => import('./pages/spying_log.jsx')} />
						<LazyRoute path='/badges/list' component={() => import('./pages/badge_list.jsx')} />
						<LazyRoute path='/badges' component={() => import('./pages/badge_select.jsx')} />

						<LazyRoute path='/tasklist' component={() => import('./pages/task_list.jsx')} />
						<LazyRoute path='/patronlist' component={() => import('./pages/patron_list.jsx')} />
						<LazyRoute path='/news/:postId' component={() => import('./pages/news.jsx')} />
						<LazyRoute path='/news' component={() => import('./pages/news_index.jsx')} />
						<LazyRoute path='/rules' component={() => import('./pages/rules.jsx')} />
						<LazyRoute path='/statistics' component={() => import('./pages/statistics.jsx')} />

						<LazyRoute path='/privacypolicy' component={() => import('./pages/privacy_policy.jsx')} />
						<LazyRoute path='/privacysettings' component={() => import('./pages/privacy_settings.jsx')} />

						<LazyRoute path='*' component={() => import('./pages/page_not_found.jsx')} />
					</Switch>
				</BrowserRouter>
				<Footer />
			</div>
		);
	}
}