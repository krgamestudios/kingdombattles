import React from 'react';
import { withRouter, Link } from 'react-router-dom';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

class PagedCombatLog extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			//
		}

		if (props.getFetch) {
			props.getFetch(() => this.sendRequest('/combatlogrequest', {username: props.username, start: props.start, length: props.length}));
		}
	}

	render() {
		//make the enemy name a link
		const PrettyName = (props) => {
			if (props.name === this.props.username) {
				return (<p {...props}>{props.name}</p>);
			} else {
				return (<p {...props}><Link to={`/profile?username=${props.name}`}>{props.name}</Link></p>);
			}
		};

		return (
			<div className='table'>
				<div className='row'>
					<p className='col centered badwrap'>When</p>
					<p className='col centered badwrap'>Attacker</p>
					<p className='col centered badwrap'>Defender</p>
					<p className='col centered badwrap'>Attacking Force</p>
					<p className='col centered badwrap'>Defending Force</p>
					<p className='col centered badwrap'>Undefended?</p>
					<p className='col centered badwrap'>Victor</p>
					<p className='col centered badwrap'>Gold Stolen</p>
					<p className='col centered badwrap'>Attacker Deaths</p>
				</div>

				{Object.keys(this.state).map((key) => <div key={key} className={'row'}>
					<p className='col centered truncate'>{ this.parseDate(this.state[key].eventTime) }</p>
					<PrettyName className='col centered truncate' name={this.state[key].attacker} />
					<PrettyName className='col centered truncate' name={this.state[key].defender} />
					<p className='col centered truncate'>{this.state[key].attackingUnits}</p>
					<p className='col centered truncate'>{this.state[key].defendingUnits}</p>
					<p className='col centered truncate'>{this.state[key].undefended ? 'yes' : 'no'}</p>
					<p className='col centered truncate'>{this.state[key].victor}</p>
					<p className='col centered truncate'>{this.state[key].spoilsGold}</p>
					<p className='col centered truncate'>{this.state[key].attackerCasualties}</p>
				</div>)}
			</div>
		);
	}

	//gameplay functions
	sendRequest(url, args = {}) { //send a unified request, using my credentials
		//build the XHR
		let xhr = new XMLHttpRequest();
		xhr.open('POST', url, true);

		xhr.onreadystatechange = () => {
			if (xhr.readyState === 4) {
				if (xhr.status === 200) {
					let json = JSON.parse(xhr.responseText);

					//on success
					this.setState(json);

					if (this.props.onReceived) {
						this.props.onReceived(json);
					}
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

	parseDate(eventTime) {
		let month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

		let date = new Date(eventTime);
		return `${date.getDate()} ${month[date.getMonth()]}`;
	}
};

PagedCombatLog.propTypes = {
	id: PropTypes.number.isRequired,
	token: PropTypes.number.isRequired,

	username: PropTypes.string.isRequired,
	start: PropTypes.number.isRequired,
	length: PropTypes.number.isRequired,

	setWarning: PropTypes.func,
	getFetch: PropTypes.func,
	onReceived: PropTypes.func
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

PagedCombatLog = connect(mapStoreToProps, mapDispatchToProps)(PagedCombatLog);

export default withRouter(PagedCombatLog);