import React from 'react';
import PropTypes from 'prop-types';

class AttackButton extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			message: ''
		};

		this.sendAttackingStatusRequest();
	}

	render() {
		if (this.state.message !== '') {
			return (
				<p className={this.props.className} style={this.props.style}>{this.state.message}</p>
			);
		} else {
			return (
				<button className={this.props.className} style={this.props.style} onClick={this.sendAttackRequest.bind(this)}>Attack</button>
			);
		}
	}

	sendAttackRequest() {
		//build the XHR
		let xhr = new XMLHttpRequest();
		xhr.open('POST', '/attackrequest', true);

		xhr.onreadystatechange = () => {
			if (xhr.readyState === 4) {
				if (xhr.status === 200) {
					let json = JSON.parse(xhr.responseText);
					if (json.status === 'attacking') {
						this.setState({ message: `Your soldiers are attacking ${json.defender}` });
					}
				} else if (xhr.status === 400) {
					if (this.props.setWarning) {
						this.props.setWarning(xhr.responseText);
					}
				}
			}
		}

		xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
		xhr.send(JSON.stringify({
			attacker: this.props.attacker,
			defender: this.props.defender,
			token: this.props.token
		}));

		if (this.props.onClick) {
			this.props.onClick();
		}

		this.props.setDisabled(true);
	}

	sendAttackingStatusRequest() {
		let xhr = new XMLHttpRequest();
		xhr.open('POST', '/attackstatusrequest', true);

		xhr.onreadystatechange = () => {
			if (xhr.readyState === 4) {
				if (xhr.status === 200) {
					let json = JSON.parse(xhr.responseText);
					if (json.status === 'attacking') {
						this.setState({ message: `Your soldiers are attacking ${json.defender}` });
					}
				}
			}
		}

		xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
		xhr.send(JSON.stringify({
			username: this.props.attacker
		}));
	}
};

AttackButton.propTypes = {
	className: PropTypes.string,
	style: PropTypes.object,
	onClick: PropTypes.func,
	setWarning: PropTypes.func,
	attacker: PropTypes.string.isRequired,
	defender: PropTypes.string.isRequired,
	token: PropTypes.number.isRequired
};

export default AttackButton;