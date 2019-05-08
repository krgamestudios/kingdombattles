import React from 'react';
import { connect } from 'react-redux';
import { withRouter, Link } from 'react-router-dom';
import PropTypes from 'prop-types';

//panels
import Signup from '../panels/signup.jsx';
import Login from '../panels/login.jsx';
import Logout from '../panels/logout.jsx';

class Home extends React.Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	render() {
		//well this is goofy
		let SidePanel;

		if (this.props.id) {
			SidePanel = () => {
				return (
					<div>
						<p>You are logged in.</p>
						<Logout />
					</div>
				);
			};
		} else {
			SidePanel = () => {
				return (
					<div>
						<Signup />
						<Login />
					</div>
				);
			};
		}

		return (
			<div className='page'>
				<p>This is the home page.</p>
				<SidePanel />
			</div>
		);
	}
}

function mapStoreToProps(store) {
	return {
		id: store.account.id
	}
}

function mapDispatchToProps(dispatch) {
	return {
		//
	}
}

Home = connect(mapStoreToProps, mapDispatchToProps)(Home);

export default withRouter(Home);