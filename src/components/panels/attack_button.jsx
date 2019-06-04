import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

class AttackButton extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			soldiers: 0, //NOTE: not stored in profile afterall
			message: ''
		};

		this.sendRequest('/attackstatusrequest', {attacker: this.props.attacker}, this.attackStatus.bind(this));
		this.sendRequest('/profilerequest', {username: this.props.attacker}, this.profileData.bind(this));
	}

	render() {
		if (this.state.message) {
			return (
				<p className={this.props.className} style={this.props.style}>{this.state.message}</p>
			);
		} else {
			//inject something extra
			let onClick = (e) => {
				this.sendRequest('/attackrequest', {attacker: this.props.attacker, defender: this.props.defender}, this.attackStatus.bind(this));
				if (this.props.onClick) {
					this.props.onClick(e);
				}
			};

			return (
				<button className={this.props.className} style={this.props.style} onClick={onClick} disabled={!this.state.soldiers}>Attack</button>
			);
		}
	}

	//gameplay functions
	sendRequest(url, args = {}, onSuccess) { //send a unified request, using my credentials
		//build the XHR
		let xhr = new XMLHttpRequest();
		xhr.open('POST', url, true);

		xhr.onreadystatechange = () => {
			if (xhr.readyState === 4) {
				if (xhr.status === 200) {
					let json = JSON.parse(xhr.responseText);

					onSuccess(json);
				}
				else if (xhr.status === 400 && this.props.setWarning) {
					this.props.setWarning(xhr.responseText);
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

	attackStatus(json) {
		if (json.status === 'attacking') {
			this.setState({ message: `Your soldiers are attacking ${json.defender}` });
		}
	}

	profileData(json) {
		this.setState({ soldiers: json.soldiers });
	}
};

AttackButton.propTypes = {
	id: PropTypes.number.isRequired,
	token: PropTypes.number.isRequired,

	attacker: PropTypes.string.isRequired,
	defender: PropTypes.string.isRequired,

	className: PropTypes.string,
	style: PropTypes.object,
	onClick: PropTypes.func,
	setWarning: PropTypes.func
};

const mapStoreToProps = (store) => {
	return {
		id: store.account.id,
		token: store.account.token
	};
};

const mapDispatchToProps = (dispatch) => {
	return {
		//
	};
};

AttackButton = connect(mapStoreToProps, mapDispatchToProps)(AttackButton);

export default AttackButton;