import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';

import PagedCombatLog from './paged_combat_log.jsx';

class CombatLog extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			start: parseInt(props.start) || 0,
			length: parseInt(props.length) || 20,
			fetch: null
		};
	}

	componentDidUpdate(prevProps, prevState, snapshot) {
		if (JSON.stringify(this.state) !== JSON.stringify(prevState)) {
			this.state.fetch();
		}
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
		let start = this.state.start + this.state.length;

		this.props.history.push(`${this.props.location.pathname}?log=${start}`);
	}

	decrement() {
		let start = Math.max(0, this.state.start - this.state.length);

		//don't decrement too far
		if (start === this.state.start) {
			return;
		}

		this.props.history.push(`${this.props.location.pathname}?log=${start}`);
	}

	//bound callbacks
	getFetch(fn) {
		this.setState({ fetch: fn });
	}

	onReceived(data) {
		if (data.length === 0) {
			let start = Math.max(0, this.state.start - this.state.length);

			//don't decrement too far
			if (start === this.state.start) {
				return;
			}

			this.props.history.replace(`${this.props.location.pathname}?log=${start}`);
		}
	}
}

CombatLog.propTypes = {
	username: PropTypes.string.isRequired
};

export default withRouter(CombatLog);