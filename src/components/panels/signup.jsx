import React from 'react';
import { validateEmail } from '../../../common/utilities.js';

export default class Signup extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			email: '',
			password: '',
			retype: '',
			warning: ''
		};
	}

	render() {
		let warningStyle = {
			display: this.state.warning.length > 0 ? 'flex' : 'none'
		};

		return (
			<div className='panel'>
				<h1>Sign Up</h1>

				<div className='warning' style={warningStyle}>
					<p>{this.state.warning}</p>
				</div>

				<form action='/signup' method='post' onSubmit={(e) => this.validateInput(e)}>
					<div>
						<label>Email:</label>
						<input type='text' name='email' value={this.state.email} onChange={this.updateEmail.bind(this)} />
					</div>

					<div>
						<label>Password:</label>
						<input type='password' name='password' value={this.state.password} onChange={this.updatePassword.bind(this)} />
					</div>

					<div>
						<label>Retype Password:</label>
						<input type='password' name='retype' value={this.state.retype} onChange={this.updateRetype.bind(this)} />
					</div>

					<button type='submit'>Sign Up</button>
				</form>
			</div>
		);
	}

	validateInput(e) {
		if (!validateEmail(this.state.email)) {
			e.preventDefault();
			this.setWarning('Invalid Email');
		}

		else if (this.state.password.length < 8) {
			e.preventDefault();
			this.setWarning('Minimum password length is 8 characters');
		}

		else if (this.state.password !== this.state.retype) {
			e.preventDefault();
			this.setWarning('Passwords do not match');
		}
	}

	setWarning(s) {
		this.setState({
			warning: s
		});
	}

	clearInput() {
		this.setState({
			email: '',
			password: '',
			retype: '',
			warning: ''
		});
	}

	updateEmail(evt) {
		this.setState({
			email: evt.target.value
		});
	}

	updatePassword(evt) {
		this.setState({
			password: evt.target.value
		});
	}

	updateRetype(evt) {
		this.setState({
			retype: evt.target.value
		});
	}
}