import React from 'react';
import { withRouter, Link } from 'react-router-dom';
import PropTypes from 'prop-types';

import BadgeText from './badge_text.jsx';

class CombatLogRecord extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			//
		};
	}

	render() {
		//NOTE: the badgeText was never meant to be used this way
		let badgeFilename = this.props.flagCaptured ? 'capture_the_flag.png' : undefined;
		let badgeName = this.props.flagCaptured ? 'Capture The Flag' : undefined;

		return (
			<div className='panel table noCollapse'>
				<hr />
				<div className='break' />
				<div className='row'>
					<p className='col truncate'>{this.parseDate(this.props.eventTime)}</p>
					<p className='col truncate'>Atk: {this.prettyName(this.props.attacker)} ({this.props.attackingUnits} units)</p>
					<p className='col truncate'>Def: {this.prettyName(this.props.defender)} ({this.props.defendingUnits} units)</p>
				</div>

				<div className='row'>
					<BadgeText name={badgeName} filename={badgeFilename} size='small' className='col truncate'><span className='mobile hide'>Victor: </span>{this.capitalizeFirstLetter(this.props.victor)} {this.props.undefended ? '(undefended)' : ''}</BadgeText>
					<p className='col truncate'>Gold: {this.props.spoilsGold}</p>
					<p className='col truncate'>Atk. Deaths: {this.props.attackerCasualties}</p>
				</div>
			</div>
		);
	}

	prettyName(name) {
		//make the enemy name a link
		if (name === this.props.username) {
			return name;
		} else {
			return (<Link to={`/profile?username=${name}`}>{name}</Link>);
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

CombatLogRecord.propTypes = {
	username: PropTypes.string.isRequired,
	eventTime: PropTypes.string.isRequired,
	attacker: PropTypes.string.isRequired,
	defender: PropTypes.string.isRequired,
	attackingUnits: PropTypes.number.isRequired,
	defendingUnits: PropTypes.number.isRequired,
	undefended: PropTypes.number.isRequired,
	victor: PropTypes.string.isRequired,
	spoilsGold: PropTypes.number.isRequired,
	attackerCasualties: PropTypes.number.isRequired
};

export default withRouter(CombatLogRecord);