import React from 'react';
import { connect } from 'react-redux';
import queryString from 'query-string';
import PropTypes from 'prop-types';

//panels
import CommonLinks from '../panels/common_links.jsx';
import PagedCombatLog from '../panels/paged_combat_log.jsx';

class CombatLog extends React.Component {
	constructor(props) {
		super(props);

		let params = queryString.parse(props.location.search);

		this.state = {
			params: params,
			start: parseInt(params.log) || 0,
			length: parseInt(params.length) || 20,

			fetch: null,

			warning: ''
		};
	}

	componentDidMount() {
		if (!this.props.loggedIn) {
			this.props.history.replace('/login');
		}
	}

	componentDidUpdate(prevProps, prevState, snapshot) {
		if (JSON.stringify(this.state) !== JSON.stringify(prevState)) {
			this.state.fetch();
		}
	}

	render() {
		let warningStyle = {
			display: this.state.warning.length > 0 ? 'flex' : 'none'
		};

		let ButtonHeader = this.buttonHeader.bind(this);

		return (
			<div className='sidePanelPage'>
				<div className='sidePanel'>
					<CommonLinks />
				</div>

				<div className='mainPanel'>
					<div className='warning' style={warningStyle}>
						<p>{this.state.warning}</p>
					</div>

					<h1 className='centered'>Combat Log</h1>

					<ButtonHeader />
					<PagedCombatLog
						setWarning={this.setWarning.bind(this)}
						username={this.props.username}
						start={this.state.start}
						length={this.state.length}
						getFetch={this.getFetch.bind(this)}
						onReceived={this.onReceived.bind(this)}
					/>
					<ButtonHeader />
				</div>
			</div>

		);
	}

	buttonHeader() {
		return (
			<div className='table noCollapse'>
				<div className='row'>
					<button className='col' onClick={ this.decrement.bind(this) }>{'< Back'}</button>
					<div className='col hide mobile' />
					<div className='col hide mobile' />
					<button className='col' onClick={ this.increment.bind(this) }>{'Next >'}</button>
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

	setWarning(s) {
		this.setState({ warning: s });
	}
};

CombatLog.propTypes = {
	username: PropTypes.string.isRequired,
	loggedIn: PropTypes.bool.isRequired
};

const mapStoreToProps = (store) => {
	return {
		username: store.account.username,
		loggedIn: store.account.id !== 0
	};
};

const mapDispatchToProps = (dispatch) => {
	return {
		//
	};
};

CombatLog = connect(mapStoreToProps, mapDispatchToProps)(CombatLog);

export default CombatLog;