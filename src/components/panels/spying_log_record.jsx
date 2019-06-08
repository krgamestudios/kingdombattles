import React from 'react';
import { withRouter, Link } from 'react-router-dom';
import PropTypes from 'prop-types';

class SpyingLogRecord extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			//
		};
	}

	render() {
		return (
			<div className='panel table noCollapse'>
				<hr />
				<div className='break' />
				<div className='row'>
					<p className='col truncate'>{this.parseDate(this.props.eventTime)}</p>
					<p className='col truncate'>Atk: {this.prettyName(this.props.attacker)} ({this.props.attackingUnits ? this.props.attackingUnits : '???'} units)</p>
					<p className='col truncate'>Def: {this.prettyName(this.props.defender)}</p>
				</div>

				<div className='row'>
					<p className='col truncate'><span className='mobile hide'>Result: </span>{this.capitalizeFirstLetter(this.props.success)}</p>
					<p className='col truncate'>Gold Stolen: {this.props.spoilsGold}</p>
					<div className='col' />
				</div>

				{Object.keys(this.props.equipmentStolen).map((key) => {
					return (
						<div key={key} className='row'>
							<p className='col truncate'><span className='mobile hide' style={{color:'red'}}>Stolen: </span>{this.props.equipmentStolen[key].name}</p>
							<p className='col truncate'>{this.props.equipmentStolen[key].type}</p>
							<p className='col truncate'><span className='mobile hide'>Total: </span>{this.props.equipmentStolen[key].quantity}</p>
						</div>
					);
				})}
			</div>
		);
	}

	prettyName(name) {
		//make the enemy name a link
		if (name === this.props.username) {
			return name;
		} else if (name) {
			return (<Link to={`/profile?username=${name}`}>{name}</Link>);
		} else {
			return (<span style={{color:'red'}}>???</span>);
		}
	}

	parseDate(eventTime) {
		let month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

		let date = new Date(eventTime);
		return `${date.getDate()} ${month[date.getMonth()]}`;
	}

	capitalizeFirstLetter(str) {
		return str.charAt(0).toUpperCase() + str.slice(1);
	}
};

SpyingLogRecord.propTypes = {
	username: PropTypes.string.isRequired,
	eventTime: PropTypes.string.isRequired,
	attacker: PropTypes.string,
	defender: PropTypes.string.isRequired,
	attackingUnits: PropTypes.number,
	success: PropTypes.string.isRequired,
	spoilsGold: PropTypes.number.isRequired,
	equipmentStolen: PropTypes.array.isRequired
};

export default withRouter(SpyingLogRecord);