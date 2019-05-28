import React from 'react';
import PropTypes from 'prop-types';

import PagedCombatLog from './paged_combat_log.jsx';

class CombatLog extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			start: props.start || 0,
			length: props.length || 20,
			fetch: null
		};
	}

	componentDidUpdate() {
		this.state.fetch();
	}

	render() {
		let ButtonHeader = this.buttonHeader.bind(this);

		return (
			<div className='panel'>
				<ButtonHeader />
				<PagedCombatLog username={this.props.username} start={this.state.start} length={this.state.length} getFetch={this.getFetch.bind(this)} onReceived={this.onReceived.bind(this)} />
				<ButtonHeader />
			</div>

		);
	}

	buttonHeader() {
		return (
			<div className='table'>
				<div className='row'>
					<button className='col' onClick={this.decrement.bind(this)}>{'< Back'}</button>
					<div className='col' />
					<div className='col' />
					<button className='col' onClick={this.increment.bind(this)}>{'Next >'}</button>
				</div>
			</div>
		);
	}

	increment() {
		this.setState({
			start: this.state.start + this.state.length
		});
	}

	decrement() {
		this.setState({
			start: Math.max(0, this.state.start - this.state.length)
		});
	}

	//bound callbacks
	getFetch(fn) {
		this.setState({ fetch: fn });
	}

	onReceived(data) {
		if (data.length === 0) {
			this.decrement();
		}
	}
}

CombatLog.propTypes = {
	username: PropTypes.string.isRequired
};

export default CombatLog;