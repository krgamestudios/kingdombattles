import React from 'react';
import { validateEmail } from '../../../common/utilities.js';
import PropTypes from 'prop-types';

class Signup extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			email: '',
			username: '',
			password: '',
			retype: '',
			promotions: false,
			warning: ''
		};
	}

	render() {
		let warningStyle = {
			display: this.state.warning.length > 0 ? 'flex' : 'none'
		};

		return (
			<div className='panel right'>
				<h1>Sign Up</h1>

				<div className='warning' style={warningStyle}>
					<p>{this.state.warning}</p>
				</div>

				<form action='/signuprequest' method='post' onSubmit={this.submit.bind(this)}>
					<div>
						<label htmlFor='email'>Email:</label>
						<input id='email' type='text' name='email' value={this.state.email} onChange={this.updateEmail.bind(this)} />
					</div>

					<div>
						<label htmlFor='username'>User Name:</label>
						<input id='username' type='text' name='username' value={this.state.username} onChange={this.updateUsername.bind(this)} />
					</div>

					<div>
						<label htmlFor='password'>Password:</label>
						<input id='password' type='password' name='password' value={this.state.password} onChange={this.updatePassword.bind(this)} />
					</div>

					<div>
						<label htmlFor='retype'>Retype Password:</label>
						<input id='retype' type='password' name='retype' value={this.state.retype} onChange={this.updateRetype.bind(this)} />
					</div>

					<div style={{paddingLeft: '34px', alignSelf: 'flex-start', flex: '1', display:'flex', flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center'}}>
						<label htmlFor='promotions'>Allow Emails:</label>
						<input id='promotions' type='checkbox' name='promotions' value={this.state.promotions} onChange={this.updatePromotions.bind(this)} />
					</div>

					<button type='submit' disabled={!this.state.email}>Sign Up</button>
				</form>
			</div>
		);
	}

	submit(e) {
		e.preventDefault();

		if (!this.validateInput()) {
			return;
		}

		//build the XHR
		let form = e.target;
		let formData = new FormData(form);

		let xhr = new XMLHttpRequest();

		xhr.onreadystatechange = () => {
			if (xhr.readyState === 4) {
				if (xhr.status === 200) {
					let json = JSON.parse(xhr.responseText);

					if (this.props.onSuccess) {
						this.props.onSuccess(json.msg);
					}
				}

				else if (xhr.status === 400) {
					this.setWarning(xhr.responseText);
				}
			}
		};

		//send the XHR
		xhr.open('POST', form.action, true);
		xhr.send(formData);

		this.clearInput();
	}

	validateInput() {
		if (!validateEmail(this.state.email)) {
			this.setWarning('Invalid Email');
			return false;
		}
		if (this.state.username.length < 4) {
			this.setWarning('Minimum username length is 4 characters');
			return false;
		}
		if (this.state.username.length > 100) {
			this.setWarning('Maximum username length is 100 characters');
			return false;
		}
		if (this.state.password.length < 8) {
			this.setWarning('Minimum password length is 8 characters');
			return false;
		}
		if (this.state.password !== this.state.retype) {
			this.setWarning('Passwords do not match');
			return false;
		}

		return true;
	}

	setWarning(s) {
		this.setState({ warning: s });
	}

	clearInput() {
		this.setState({ email: '', username: '', password: '', retype: '', promotions: false, warning: '' });
	}

	updateEmail(evt) {
		this.setState({ email: evt.target.value });
	}

	updateUsername(evt) {
		this.setState({ username: evt.target.value });
	}

	updatePassword(evt) {
		this.setState({ password: evt.target.value });
	}

	updateRetype(evt) {
		this.setState({ retype: evt.target.value });
	}

	updatePromotions(evt) {
		this.setState({ promotions: evt.target.value });
	}
};

Signup.propTypes = {
	onSuccess: PropTypes.func
};

export default Signup;