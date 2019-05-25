import React from 'react';
import { withRouter, Link } from 'react-router-dom';
import { connect } from 'react-redux';

import Logout from './logout.jsx';

class CommonLinks extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			//
		}
	}

	render() {
		//render extra stuff
		let Extra;
		if (this.props.extra) {
			Extra = this.props.extra;
		} else {
			Extra = () => null;
		}

		//disable the profile link when logged out
		let ProfileLink;
		if (this.props.loggedIn) {
			ProfileLink = () => <p><Link to='/profile' onClick={this.props.onClickProfile}>Your Profile</Link></p>;
		} else {
			ProfileLink = () => null;
		}

		//disable the logout button when logged out
		let LogoutLink;
		if (this.props.loggedIn) {
			LogoutLink = () => <Logout onClick={() => this.props.history.push('/')} />;
		} else {
			LogoutLink = () => null;
		}


		return (
			<div className='panel'>
				<p><Link to='/' onClick={this.props.onClickHome}>Return Home</Link></p>
				<ProfileLink />
				<p><Link to='/ladder' onClick={this.props.onClickLadder}>Game Ladder</Link></p>
				<p><Link to='/passwordchange' onClick={this.props.onClickLadder}>Change Password</Link></p>

				<Extra />

				<LogoutLink />
			</div>
		);
	}
}

function mapStoreToProps(store) {
	return {
		loggedIn: store.account.id !== 0
	}
}

function mapDispatchToProps(dispatch) {
	return {
		//
	}
}

CommonLinks = connect(mapStoreToProps, mapDispatchToProps)(CommonLinks);

export default withRouter(CommonLinks);