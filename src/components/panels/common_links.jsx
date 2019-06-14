import React from 'react';
import { withRouter, Link } from 'react-router-dom';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import Logout from './logout.jsx';

class CommonLinks extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			//
		}
	}

	render() {
		//render any extra stuff
		let Extra;

		if (this.props.extra) {
			Extra = this.props.extra;
		} else {
			Extra = () => null;
		}

		//if logged in
		if (this.props.loggedIn) {
			return (
				<div className='panel'>
					<p className='mobile centered'><Link to='/profile' onClick={this.props.onClickProfile}>Your Kingdom</Link></p>
					<p className='mobile centered'><Link to='/equipment' onClick={this.props.onClickEquipment}>Your Equipment</Link></p>
					<p className='mobile centered'><Link to='/badges' onClick={this.props.onClickBadges}>Your Badges</Link></p>
					<p className='mobile centered'><Link to='/ladder' onClick={this.props.onClickLadder}>Attack (Game Ladder)</Link></p>
					<p className='mobile centered'><Link to='/combatlog' onClick={this.props.onClickCombatLog}>Combat Log</Link></p>
					<p className='mobile centered'><Link to='/spyinglog' onClick={this.props.onClickSpyingLog}>Espionage Log</Link></p>
					<p className='mobile centered'><Link to='/passwordchange' onClick={this.props.onClickPasswordChange}>Change Password</Link></p>
					<p className='mobile centered'><Link to='/tasklist' onClick={this.props.onClickTaskList}>Task List</Link></p>
					<p className='mobile centered'><Link to='/patronlist' onClick={this.props.onClickPatronList}>Patron List</Link></p>
					<p className='mobile centered'><Link to='/rules' onClick={this.props.onClickRules}>Rules</Link></p>
					<p className='mobile centered'><Link to='/statistics' onClick={this.props.onClickStatistics}>Game Stats</Link></p>
					<p className='mobile centered'><Link to='/privacysettings' onClick={this.props.onClickPrivacySettings}>Privacy Settings</Link></p>

					<Extra />

					<Logout onClick={ () => this.props.history.push('/') } />
				</div>
			);
		} else { //if not logged in
			return (
				<div className='panel'>
					<p className='mobile centered'><Link to='/signup' onClick={this.props.onClickSignup}>Sign Up</Link></p>
					<p className='mobile centered'><Link to='/login' onClick={this.props.onClickLogin}>Login</Link></p>
					<p className='mobile centered'><Link to='/passwordrecover' onClick={this.props.onClickPasswordRecover}>Recover Password</Link></p>
					<p className='mobile centered'><Link to='/ladder' onClick={this.props.onClickLadder}>Game Ladder</Link></p>
					<p className='mobile centered'><Link to='/tasklist' onClick={this.props.onClickTaskList}>Task List</Link></p>
					<p className='mobile centered'><Link to='/patronlist' onClick={this.props.onClickPatronList}>Patron List</Link></p>
					<p className='mobile centered'><Link to='/rules' onClick={this.props.onClickRules}>Rules</Link></p>
					<p className='mobile centered'><Link to='/statistics' onClick={this.props.onClickStatistics}>Game Stats</Link></p>

					<Extra />
				</div>
			);
		}
	}
};

CommonLinks.propTypes = {
	loggedIn: PropTypes.bool.isRequired,

	onClickSignup: PropTypes.func,
	onClickLogin: PropTypes.func,
	onClickPasswordChange: PropTypes.func,
	onClickPasswordRecover: PropTypes.func,
	onClickProfile: PropTypes.func,
	onClickEquipment: PropTypes.func,
	onClickBadges: PropTypes.func,
	onClickLadder: PropTypes.func,
	onClickCombatLog: PropTypes.func,
	onClickSpyingLog: PropTypes.func,
	onClickTaskList: PropTypes.func,
	onClickPatronList: PropTypes.func,
	onClickRules: PropTypes.func,
	onClickStatistics: PropTypes.func,
	onClickPrivacySettings: PropTypes.func
};

function mapStoreToProps(store) {
	return {
		loggedIn: store.account.id !== undefined && store.account.id !== 0
	}
};

function mapDispatchToProps(dispatch) {
	return {
		//
	}
};

CommonLinks = connect(mapStoreToProps, mapDispatchToProps)(CommonLinks);

export default withRouter(CommonLinks);