import React from 'react';
import { withRouter, Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import queryString from 'query-string';

//panels
import PasswordResetPanel from '../panels/password_reset.jsx';

class PasswordReset extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			reset: false,
			resetMsg: '',
			params: queryString.parse(props.location.search)
		}
	}

	render() {
		let Panel;

		if (!this.state.reset) {
			Panel = () => {
				return (<PasswordResetPanel email={this.state.params.email} token={this.state.params.token} onPasswordReset={(msg) => this.setState( {reset: true, resetMsg: msg} )}/>);
			}
		} else {
			Panel = () => {
				return (<p>{this.state.resetMsg}</p>);
			}
		}

		return (
			<div className='page centered'>
				<Panel />
				<Link to='/'>Return Home</Link>
			</div>
		);
	}
};

export default withRouter(PasswordReset);