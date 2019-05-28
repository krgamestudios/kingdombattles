import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { setAttackDisabled } from '../../actions/combat.js';

class AttackButton extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			//
		};
	}

	render() {
		return (
			<button className={this.props.className} style={this.props.style} onClick={this.sendAttackRequest.bind(this)} disabled={this.props.disabled}>Attack</button>
		);
	}

	sendAttackRequest() {
		//build the XHR
		let xhr = new XMLHttpRequest();
		xhr.open('POST', '/attackrequest', true);

		xhr.onreadystatechange = () => {
			if (xhr.readyState === 4) {
				if (xhr.status === 200) {
					//DO NOTHING
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
			defender: this.props.defender
		}));

		if (this.props.onClick) {
			this.props.onClick();
		}

		this.props.setDisabled(true);
	}
};

AttackButton.propTypes = {
	className: PropTypes.string,
	style: PropTypes.object,
	onClick: PropTypes.func,
	setWarning: PropTypes.func,
	attacker: PropTypes.string.isRequired,
	defender: PropTypes.string.isRequired,

	disabled: PropTypes.bool.isRequired,
	setDisabled: PropTypes.func.isRequired
};

function mapStoreToProps(store) {
	return {
		disabled: store.combat.attackDisabled
	}
}

function mapDispatchToProps(dispatch) {
	return {
		setDisabled: (disabled) => dispatch(setAttackDisabled(disabled))
	}
}

AttackButton = connect(mapStoreToProps, mapDispatchToProps)(AttackButton);

export default AttackButton;