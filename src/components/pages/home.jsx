import React from 'react';
import { connect } from 'react-redux';
import { withRouter, Link } from 'react-router-dom';
import PropTypes from 'prop-types';

//panels
import Signup from '../panels/signup.jsx';
import Login from '../panels/login.jsx';
import Logout from '../panels/logout.jsx';
import PasswordChange from '../panels/password_change.jsx';
import PasswordRecover from '../panels/password_recover.jsx';

class Home extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			changedPassword: false,
			signupSent: false,
			signupMsg: '',
			recoverSent: false,
			recoverMsg: ''
		};
	}

	//rendering function
	render() {
		//get the correct side panel
		let SidePanel;

		if (this.props.id) {
			SidePanel = this.LoggedInSidePanel.bind(this);
		} else {
			SidePanel = this.LoggedOutSidePanel.bind(this);
		}

		//TODO: news column

		//return the home page
		return (
			<div className='page'>
				<h1 style={{textAlign: 'center', fontSize: '50px', margin: '30px'}}>KINGDOM BATTLES!</h1>
				<div className='sidePanelPage'>
					<SidePanel />
					<div className='newsPanel'>
						<h1 className='centered'>News</h1>
						<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
						<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
						<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
						<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
						<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
						<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
						<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
						<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
					</div>
				</div>
			</div>
		);
	}

	//panel functions
	LoggedInSidePanel() {
		//reset the other mode
		if (this.state.signupSent) {
			this.setState({ signupSent: false });
		}

		if (this.state.recoverSent) {
			this.setState({ recoverSent: false });
		}

		//build the password change panel
		let PasswordChangePanel;

		if (!this.state.changedPassword) {
			PasswordChangePanel = () => {
				return (<PasswordChange onPasswordChange={() => { this.setState({changedPassword: true}) }} />);
			}
		} else {
			PasswordChangePanel = () => {
				return (<p>Password changed!</p>);
			}
		}

		//finally return the side panel
		return (
			<div className='sidePanel'>
				<p>Go to <Link to='/profile'>your profile</Link></p>
				<PasswordChangePanel />
				<Logout />
			</div>
		);
	}

	LoggedOutSidePanel() {
		//reset the other mode
		if (this.state.changedPassword) {
			this.setState({ changedPassword: false });
		}

		//build the signup panel
		let SignupPanel;

		if (!this.state.signupSent) {
			SignupPanel = () => {
				return (
					<Signup onSignup={(msg) => this.setState( {signupSent: true, signupMsg: msg} )} />
				);
			}
		} else {
			SignupPanel = () => {
				return (
					<p>{this.state.signupMsg}</p>
				);
			}
		}

		//build the recover panel
		let RecoverPanel;

		if (!this.state.recoverSent) {
			RecoverPanel = () => {
				return (
					<PasswordRecover onEmailSent={(msg) => this.setState( {recoverSent: true, recoverMsg: msg} )} />
				);
			}
		}
		else {
			RecoverPanel = () => {
				return (
					<p>{this.state.recoverMsg}</p>
				);
			}
		}

		//finally return the side panel 
		return (
			<div className='sidePanel'>
				<SignupPanel />
				<Login />
				<RecoverPanel />
			</div>
		);
	}
}

Home.propTypes = {
	id: PropTypes.number.isRequired,
	token: PropTypes.number.isRequired
};

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