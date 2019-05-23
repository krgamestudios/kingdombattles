import React from 'react';
import { connect } from 'react-redux';
import { withRouter, Link } from 'react-router-dom';
import PropTypes from 'prop-types';

//panels
import CommonLinks from '../panels/common_links.jsx';

import Signup from '../panels/signup.jsx';
import Login from '../panels/login.jsx';
import PasswordRecover from '../panels/password_recover.jsx';

import NewsPanel from '../panels/news_panel.jsx';

class Home extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
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

		//return the home page
		return (
			<div className='page'>
				<h1 style={{textAlign: 'center', fontSize: '50px', margin: '30px'}}>KINGDOM BATTLES!</h1>

				<div className='sidePanelPage'>
					<SidePanel />

					<div className='mainPanel'>
						<h1 className='centered'>News</h1>
						<NewsPanel />
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

		//finally return the side panel
		return (
			<div className='sidePanel'>
				<CommonLinks />
			</div>
		);
	}

	LoggedOutSidePanel() {
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
				<Login onSubmit={() => {this.props.history.push('/profile');}} />
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