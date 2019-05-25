import React from 'react';
import { connect } from 'react-redux';
import { logout } from '../../actions/accounts.js';
import PropTypes from 'prop-types';

class Logout extends React.Component {
	constructor(props) {
		super(props);
	}

	render() {
		return (
			<button className='logoutButton' type='submit' onClick={(e) => this.submit(e)}>Logout</button>
		);
	}

	submit(e) {
		e.preventDefault();

		//build the XHR
		let xhr = new XMLHttpRequest();
		xhr.open('POST', '/logoutrequest', true);
		xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
		xhr.send(JSON.stringify({
			email: this.props.email,
			token: this.props.token
		}));

		this.props.logout();

		if (this.props.onClick) {
			this.props.onClick();
		}
	}
}

Logout.propTypes = {
	email: PropTypes.string.isRequired,
	token: PropTypes.number.isRequired,
	logout: PropTypes.func.isRequired,
	onClick: PropTypes.func
}

function mapStoreToProps(store) {
	return {
		email: store.account.email,
		token: store.account.token
	}
}

function mapDispatchToProps(dispatch) {
	return {
		logout: () => { dispatch(logout()) }
	}
}

Logout = connect(mapStoreToProps, mapDispatchToProps)(Logout);

export default Logout;