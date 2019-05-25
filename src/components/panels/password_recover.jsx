import React from 'react';
import { validateEmail } from '../../../common/utilities.js';

class PasswordRecover extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			email: '',
			warning: ''
		};
	}

	render() {
		let warningStyle = {
			display: this.state.warning.length > 0 ? 'flex' : 'none'
		};

		return (
			<div className='panel left'>
				<h1>Recover Password</h1>

				<div className='warning' style={warningStyle}>
					<p>{this.state.warning}</p>
				</div>

				<form action='/passwordrecover' method='post' onSubmit={(e) => this.submit(e)}>
					<div>
						<label>Email:</label>
						<input type='text' name='email' value={this.state.email} onChange={this.updateEmail.bind(this)} />
					</div>

					<button type='submit' disabled={!this.state.email}>Send Email</button>
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
					//DEBUGGING
					if (this.props.onEmailSent) {
						this.props.onEmailSent(xhr.responseText);
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
			warning: ''
		});
	}

	updateEmail(evt) {
		this.setState({
			email: evt.target.value
		});
	}
}

export default PasswordRecover;