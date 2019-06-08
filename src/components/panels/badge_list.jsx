import React from 'react';
import PropTypes from 'prop-types';

import Badge from './badge.jsx';

class BadgeList extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			data: {}
		};

		if (props.getFetch) {
			props.getFetch(() => this.sendRequest('/badgeslistrequest'));
		}
	}

	render() {
		if (!this.state.data.statistics) {
			return (
				<p className='panel'>Loading badges...</p>
			);
		}

		return (
			<div className='panel table'>
				{Object.keys(this.state.data.statistics).map((name) =>
					<div key={name}>
						<div className={'panel row'} style={{padding: 10}}>
							<div className={'col centered'} style={{ minWidth: 110 }}>
								<Badge name={name} filename={this.state.data.statistics[name].filename} />
							</div>
							<div className={'col'} style={{flex: 4, display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
								<h2>{name}</h2>
								<p>{this.state.data.statistics[name].description}</p>
								<p>Unlockable: {this.state.data.statistics[name].unlockable ? <span style={{color: 'lightgreen'}}>Yes</span> : this.state.data.statistics[name].unlockable === null ? <span style={{color: 'yellow'}}>Coding Incomplete</span> : <span style={{color: 'red'}}>No</span>}</p>
							</div>
						</div>
						<div className='row'>
							<hr className='col mobile show' />
						</div>
					</div>
				)}
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
					this.setState({ data: Object.assign({}, this.state.data, json) });
				}
				else if (xhr.status === 400 && this.props.setWarning) {
					this.props.setWarning(xhr.responseText);
				}
			}
		};

		xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
		xhr.send(JSON.stringify({
			...args
		}));
	}
};

BadgeList.propTypes = {
	setWarning: PropTypes.func,
	getFetch: PropTypes.func
};

export default BadgeList;