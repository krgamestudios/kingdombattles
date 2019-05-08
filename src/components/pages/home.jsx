import React from 'react';
import { connect } from 'react-redux';
import { withRouter, Link } from 'react-router-dom';
import PropTypes from 'prop-types';

//panels
import Signup from '../panels/signup.jsx';
import Login from '../panels/login.jsx';
import Logout from '../panels/logout.jsx';
import PasswordChange from '../panels/password_change.jsx';

class Home extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			changedPassword: false
		};
	}

	render() {
		//DEBUGGING: well this is goofy
		let SidePanel;

		if (this.props.id) {
			SidePanel = () => {
				let PasswordChangePanel;

				if (!this.state.changedPassword) {
					PasswordChangePanel = () => {
						return (<PasswordChange onSubmit={() => { this.setState({changedPassword: true}) }} />);
					}
				} else {
					PasswordChangePanel = () => {
						return (<p>Password changed!</p>);
					}
				}

				return (
					<div>
						<p>You are logged in.</p>
						<PasswordChangePanel />
						<Logout />
					</div>
				);
			};
		} else {
			SidePanel = () => {
				if (this.state.changedPassword) {
					this.setState({changedPassword: false});
				}
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
		id: store.account.id,
		token: store.account.token
	}
}

function mapDispatchToProps(dispatch) {
	return {
		//
	}
}

Home = connect(mapStoreToProps, mapDispatchToProps)(Home);

export default withRouter(Home);