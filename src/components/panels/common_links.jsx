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
					<p><Link to='/profile' onClick={this.props.onClickProfile}>Your Kingdom</Link></p>
					<p><Link to='/equipment' onClick={this.props.onClickCombatLog}>Your Equipment</Link></p>
					<p><Link to='/ladder' onClick={this.props.onClickLadder}>Game Ladder</Link></p>
					<p><Link to='/combatlog' onClick={this.props.onClickCombatLog}>Combat Log</Link></p>
					<p><Link to='/passwordchange' onClick={this.props.onClickPasswordChange}>Change Password</Link></p>
					<p><Link to='/tasklist' onClick={this.props.onClickTaskList}>Task List</Link></p>
					<p><Link to='/patronlist' onClick={this.props.onClickTaskList}>Patron List</Link></p>

					<Extra />

					<Logout onClick={ () => this.props.history.push('/') } />
				</div>
			);
		} else { //if not logged in
			return (
				<div className='panel'>
					<p><Link to='/signup' onClick={this.props.onClickSignup}>Sign Up</Link></p>
					<p><Link to='/login' onClick={this.props.onClickLogin}>Login</Link></p>
					<p><Link to='/passwordrecover' onClick={this.props.onClickPasswordRecover}>Recover Password</Link></p>
					<p><Link to='/ladder' onClick={this.props.onClickLadder}>Game Ladder</Link></p>
					<p><Link to='/tasklist' onClick={this.props.onClickTaskList}>Task List</Link></p>
					<p><Link to='/patronlist' onClick={this.props.onClickTaskList}>Patron List</Link></p>

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
	onClickPasswordRecover: PropTypes.func,
	onClickHome: PropTypes.func,
	onClickProfile: PropTypes.func,
	onClickLadder: PropTypes.func,
	onClickPasswordChange: PropTypes.func,
	onClickTaskList: PropTypes.func
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