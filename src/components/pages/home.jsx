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
			signedUp: false,
			signupMsg: '',
			recoverSent: false,
			recoverMsg: ''
		};
	}

	render() {
		//DEBUGGING: well this is goofy
		let SidePanel;

		if (this.props.id) { //logged in
			SidePanel = () => {
				if (this.state.signedUp) {
					this.setState({ signedUp: false });
				}

				if (this.state.recoverSent) {
					this.setState({ recoverSent: false });
				}

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

				return (
					<div>
						<p>You are logged in.</p>
						<PasswordChangePanel />
						<Logout />
					</div>
				);
			};
		} else { //not logged in
			SidePanel = () => {
				if (this.state.changedPassword) {
					this.setState({ changedPassword: false });
				}

				let SignupPanel;

				if (!this.state.signedUp) {
					SignupPanel = () => {
						return (
							<Signup onSignup={(msg) => this.setState( {signedUp: true, signupMsg: msg} )} />
						);
					}
				} else {
					SignupPanel = () => {
						return (
							<p>{this.state.signupMsg}</p>
						);
					}
				}

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

				return (
					<div>
						<SignupPanel />
						<Login />
						<RecoverPanel />
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