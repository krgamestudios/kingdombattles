import React from 'react';
import { connect } from 'react-redux';
import { logout } from '../../actions/accounts.js';

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
		xhr.open('POST', '/logout', true);
		xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
		xhr.send(JSON.stringify({
			email: this.props.email,
			token: this.props.token
		}));

		this.props.logout();
	}
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