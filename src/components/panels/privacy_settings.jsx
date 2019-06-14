import React from 'react';
import PropTypes from 'prop-types';

class Signup extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			promotions: false
		};

		this.sendRequest('/privacysettingsrequest');
	}

	render() {
		return (
			<div className='panel'>
				<form className='table noCollapse' action='/privacysettingsupdaterequest' method='post' onSubmit={this.submit.bind(this)}>
					<hr />
					<div className='break' />

					<div className='row'>
						<label className='col' htmlFor='promotions'>Allow Emails:</label>
						<input className='col' id='promotions' type='checkbox' name='promotions' checked={this.state.promotions} onChange={this.updatePromotions.bind(this)} />
						<div className='col double mobile hide' />
					</div>

					<div className='break' />

					<div className='row'>
						<button className='col' type='submit'>Update Privacy Settings</button>
						<div className='col mobile hide' />
						<div className='col double mobile hide' />
					</div>
				</form>
			</div>
		);
	}

	//TODO: Fix this copy/pasted crap
	//gameplay functions
	sendRequest(url, args = {}) { //send a unified request, using my credentials
		//build the XHR
		let xhr = new XMLHttpRequest();
		xhr.open('POST', url, true);

		xhr.onreadystatechange = () => {
			if (xhr.readyState === 4) {
				if (xhr.status === 200) {
					let json = JSON.parse(xhr.responseText);

					this.setState({
						promotions: json.promotions
					});
				}
				else if (xhr.status === 400) {
					this.setWarning(xhr.responseText);
				}
			}
		};

		xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
		xhr.send(JSON.stringify({
			id: this.props.id,
			token: this.props.token,
			...args
		}));
	}

	submit(e) {
		e.preventDefault();

		//build the XHR
		let form = e.target;
		let formData = new FormData(form);

		formData.append('id', this.props.id);
		formData.append('token', this.props.token);

		let xhr = new XMLHttpRequest();

		xhr.onreadystatechange = () => {
			if (xhr.readyState === 4) {
				if (xhr.status === 200) {
					let json = JSON.parse(xhr.responseText);

					if (this.props.onSuccess) {
						this.props.onSuccess(json.msg);
					}
				}

				else if (xhr.status === 400 && this.props.setWarning) {
					this.props.setWarning(xhr.responseText);
				}
			}
		};

		//send the XHR
		xhr.open('POST', form.action, true);
		xhr.send(formData);

		this.clearInput();
	}

	clearInput() {
		this.setState({ promotions: false });
	}

	updatePromotions(evt) {
		this.setState({ promotions: !this.state.promotions });
	}
};

Signup.propTypes = {
	id: PropTypes.number.isRequired,
	token: PropTypes.number.isRequired,

	setWarning: PropTypes.func,
	onSuccess: PropTypes.func
};

export default Signup;