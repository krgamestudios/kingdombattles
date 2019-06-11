import React from 'react';
import { connect } from 'react-redux';
import queryString from 'query-string';

import CommonLinks from '../panels/common_links.jsx';
import PagedLadder from '../panels/paged_ladder.jsx';

class Ladder extends React.Component {
	constructor(props) {
		super(props);

		let params = queryString.parse(props.location.search);

		this.state = {
			params: params,
			start: parseInt(params.rank) || 0,
			length: 50,
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
			<div className='page'>
				<div className='sidePanelPage'>
					<div className='sidePanel'>
						<CommonLinks />
					</div>

					<div className='mainPanel'>
						<h1 className='centered'>Game Ladder</h1>
						<ButtonHeader />

						<div className='half break mobile hide' />

						<PagedLadder
							start={this.state.start}
							length={this.state.length}
							highlightedName={this.props.username}
							getFetch={this.getFetch.bind(this)}
							onReceived={this.onReceived.bind(this)}
						/>
						<ButtonHeader />
					</div>
				</div>
			</div>
		);
	}

	buttonHeader() {
		return (
			<div className='table noCollapse'>
				<div className='row'>
					<button className='col' onClick={this.decrement.bind(this)}>{'< Back'}</button>
					<div className='col hide mobile' />
					<div className='col hide mobile' />
					<button className='col' onClick={this.increment.bind(this)}>{'Next >'}</button>
				</div>
			</div>
		);
	}

	increment() {
		let start = this.state.start + this.state.length;

		this.props.history.push(`${this.props.location.pathname}?rank=${start}`);
	}

	decrement() {
		let start = Math.max(0, this.state.start - this.state.length);

		//don't decrement too far
		if (start === this.state.start) {
			return;
		}

		this.props.history.push(`${this.props.location.pathname}?rank=${start}`);
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

			this.props.history.replace(`${this.props.location.pathname}?rank=${start}`);
		}
	}
};

const mapStoreToProps = (store) => {
	return {
		username: store.account.username
	};
};

const mapDispatchToProps = (dispatch) => {
	return {
		//
	};
};

Ladder = connect(mapStoreToProps, mapDispatchToProps)(Ladder);

export default Ladder;