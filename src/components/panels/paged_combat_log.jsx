import React from 'react';
import { withRouter, Link } from 'react-router-dom';
import PropTypes from 'prop-types';

class PagedCombatLog extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			data: {}
		}

		if (props.getFetch) {
			props.getFetch(this.fetchCombatLog.bind(this));
		}
	}

	render() {
		return (
			<div className='table'>
				<div className='row'>
					<p className='col centered minWidth'>When</p>
					<p className='col centered minWidth'>Attacker</p>
					<p className='col centered minWidth'>Defender</p>
					<p className='col centered minWidth'>Attacking Force</p>
					<p className='col centered minWidth'>Defending Force</p>
					<p className='col centered minWidth'>Undefended?</p>
					<p className='col centered minWidth'>Victor</p>
					<p className='col centered minWidth'>Gold Lost</p>
					<p className='col centered minWidth'>Victor Casualties</p>
				</div>
				{Object.keys(this.state.data).map((key) => <div key={key} className={'row'}>
					<p className='col centered minWidth'>{ this.parseDate(this.state.data[key].eventTime) }</p>
					<p className='col centered minWidth'><Link to={`/profile?username=${this.state.data[key].attackerUsername}`} className={'col'}>{this.state.data[key].attackerUsername}</Link></p>
					<p className='col centered minWidth'><Link to={`/profile?username=${this.state.data[key].defenderUsername}`} className={'col'}>{this.state.data[key].defenderUsername}</Link></p>
					<p className='col centered minWidth'>{this.state.data[key].attackingUnits}</p>
					<p className='col centered minWidth'>{this.state.data[key].defendingUnits}</p>
					<p className='col centered minWidth'>{this.state.data[key].undefended ? 'yes' : 'no'}</p>
					<p className='col centered minWidth'>{this.state.data[key].victor}</p>
					<p className='col centered minWidth'>{this.state.data[key].spoilsGold}</p>
					<p className='col centered minWidth'>{this.state.data[key].casualtiesVictor}</p>
				</div>)}
			</div>
		);
	}

	fetchCombatLog(username = this.props.username, start = this.props.start, length = this.props.length) {
		//build the XHR
		let xhr = new XMLHttpRequest();

		xhr.onreadystatechange = () => {
			if (xhr.readyState === 4) {
				if (xhr.status === 200) {
					let data = JSON.parse(xhr.responseText);
					this.setState({data: data});

					if (this.props.onReceived) {
						this.props.onReceived(data);
					}
				}
			}
		}

		xhr.open('POST', '/combatlogrequest', true);
		xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
		xhr.send(JSON.stringify({
			username: username,
			start: start,
			length: length
		}));
	}

	parseDate(eventTime) {
		let month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

		let date = new Date(eventTime);
		return `${date.getDate()} ${month[date.getMonth()]}`;
	}
}

PagedCombatLog.propTypes = {
	username: PropTypes.string.isRequired,
	start: PropTypes.number.isRequired,
	length: PropTypes.number.isRequired,
	getFetch: PropTypes.func,
	onReceived: PropTypes.func
};

export default withRouter(PagedCombatLog);