import React from 'react';

import CommonLinks from '../panels/common_links.jsx';
import PagedLadder from '../panels/paged_ladder.jsx';

class Ladder extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			start: 0,
			length: 50,
			fetch: null
		};
	}

	componentDidUpdate() {
		this.state.fetch();
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
						<ButtonHeader />
						<PagedLadder start={this.state.start} length={this.state.length} getFetch={this.getFetch.bind(this)} onReceived={this.onReceived.bind(this)} />
						<ButtonHeader />
					</div>
				</div>
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

export default Ladder;