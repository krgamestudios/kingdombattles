import React from 'react';
import { connect } from 'react-redux';
import { login } from '../../actions/accounts.js';
import { validateEmail } from '../../../common/utilities.js';

class Login extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			email: '',
			password: '',
			warning: ''
		};
	}

	render() {
		let warningStyle = {
			display: this.state.warning.length > 0 ? 'flex' : 'none'
		};

		return (
			<div className='panel right'>
				<h1>Login</h1>

				<div className='warning' style={warningStyle}>
					<p>{this.state.warning}</p>
				</div>

				<form action='/loginrequest' method='post' onSubmit={(e) => this.submit(e)}>
					<div>
						<label>Email:</label>
						<input type='text' name='email' value={this.state.email} onChange={this.updateEmail.bind(this)} />
					</div>

					<div>
						<label>Password:</label>
						<input type='password' name='password' value={this.state.password} onChange={this.updatePassword.bind(this)} />
					</div>

					<button type='submit' disabled={!this.state.email}>Login</button>
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
					this.props.login(json.id, json.email, json.username, json.token);

					if (this.props.onSubmit) {
						this.props.onSubmit();
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

	validateInput(e) {
		if (!validateEmail(this.state.email)) {
			this.setWarning('Invalid Email');
			return false;
		}

		if (this.state.password.length < 8) {
			this.setWarning('Minimum password length is 8 characters');
			return false;
		}

		return true;
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
}

function mapStoreToProps(store) {
	return {
		//
	}
}

function mapDispatchToProps(dispatch) {
	return {
		login: (id, email, username, token) => { dispatch(login(id, email, username, token)) }
	}
}

Login = connect(mapStoreToProps, mapDispatchToProps)(Login);

export default Login;