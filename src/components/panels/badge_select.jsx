import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import Badge from './badge.jsx';

class BadgeSelect extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			data: {}
		};

		if (props.getFetch) {
			props.getFetch(() => this.sendRequest('/badgesownedrequest'));
		}
	}

	render() {
		if (!this.state.data.owned) {
			return (
				<p className='panel'>Loading badges...</p>
			);
		}

		//are none selected?
		let anySelected = Object.keys(this.state.data.owned).reduce((accumulator, name) => accumulator || this.state.data.owned[name].active, false);

		return (
			<div className='panel table'>
			<div key={name}>
					<div className={`panel row${!anySelected ? ' highlight' : ''}`} style={{padding: 10, minHeight: 120}} onClick={ () => this.sendRequest('/badgeselectactiverequest', { name: null }) }>
						<p className={'col centered'} style={{alignSelf: 'center'}}>No Badge</p>
					</div>
					<div className='row'>
						<hr className='col mobile show' />
					</div>
				</div>

				{Object.keys(this.state.data.owned).map((name) =>
					<div key={name}>
						<div className={`panel row${this.state.data.owned[name].active ? ' highlight' : ''}`} style={{padding: 10}} onClick={ () => this.sendRequest('/badgeselectactiverequest', { name: name }) }>
							<div className={'col centered'} style={{ minWidth: 110 }}>
								<Badge name={name} filename={this.state.data.statistics[name].filename} />
							</div>
							<p className={'col'} style={{flex: 4, alignSelf: 'center'}}>{this.state.data.statistics[name].description}</p>
						</div>
						<div className='row'>
							<hr className='col mobile show' />
						</div>
					</div>
				).reverse()}
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
			id: this.props.id,
			token: this.props.token,
			...args
		}));
	}
};

BadgeSelect.propTypes = {
	id: PropTypes.number.isRequired,
	token: PropTypes.number.isRequired,

	setWarning: PropTypes.func,
	getFetch: PropTypes.func
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

BadgeSelect = connect(mapStoreToProps, mapDispatchToProps)(BadgeSelect);

export default BadgeSelect;