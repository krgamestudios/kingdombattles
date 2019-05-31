import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { logout } from '../../actions/account.js';

class Logout extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			//
		}
	}

	render() {
		return (
			<button className='logoutButton' type='submit' onClick={(e) => { e.preventDefault(); this.sendRequest('/logoutrequest') }} >Logout</button>
		);
	}

	sendRequest(url, args = {}) { //send a unified request, using my credentials
		//build the XHR
		let xhr = new XMLHttpRequest();
		xhr.open('POST', url, true);

		xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
		xhr.send(JSON.stringify({
			id: this.props.id,
			token: this.props.token,
			...args
		}));

		//Don't wait for a response
		this.props.logout();

		if (this.props.onClick) {
			this.props.onClick();
		}
	}
};

Logout.propTypes = {
	id: PropTypes.number.isRequired,
	token: PropTypes.number.isRequired,
	logout: PropTypes.func.isRequired,

	onClick: PropTypes.func
};

function mapStoreToProps(store) {
	return {
		id: store.account.id,
		token: store.account.token
	}
};

function mapDispatchToProps(dispatch) {
	return {
		logout: () => { dispatch(logout()) }
	}
};

Logout = connect(mapStoreToProps, mapDispatchToProps)(Logout);

export default Logout;