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
			ProfileLink = () => <p>Go to <Link to='/profile' onClick={this.props.onClickProfile}>your profile</Link></p>;
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
				<p>Return <Link to='/' onClick={this.props.onClickHome}>home</Link></p>
				<ProfileLink />
				<p>Go to <Link to='/ladder' onClick={this.props.onClickLadder}>the game ladder</Link></p>

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