import React from 'react';
import PropTypes from 'prop-types';

class Equipment extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			statistics: {},
			equipment: {}
		};

		if (this.props.getFetchStatistics) {
//			this.props.getFetchStatistics(this.fetchStatistics.bind(this));
		}

		this.fetchStatistics();

		if (this.props.getFetchEquipment) {
//			this.props.getFetchEquipment(this.fetchEquipmentList.bind(this));
		}

		this.fetchEquipmentList();
	}

	render() {
		//print the purchasable weapons, then purchasable armour, then stuff you can't buy
		let statistics = JSON.parse(JSON.stringify(this.state.statistics));

		//filter out what you can't get at your current scientist count
		Object.keys(statistics).forEach((typeKey) => {
			Object.keys(statistics[typeKey]).forEach((nameKey) => {
				if (statistics[typeKey][nameKey].scientists > this.props.scientists) {
					delete statistics[typeKey][nameKey];
				}
				if (Object.keys(statistics[typeKey]).length === 0) {
					delete statistics[typeKey];
				}
			});
		});

		console.log(this.state.statistics);
		console.log(statistics);

		return (
			<div className='panel'>
				<div className='table'>

					<div className='row'>
						<p className='col'>Equipment Name</p>
						<p className='col'>Equipment Type</p>
						<p className='col'>Quantity</p>
						<p className='col'>Cost</p>
						<p className='col'>Buy</p>
						<p className='col'>Sell</p>
					</div>



				</div>
			</div>
		);
	}

	fetchStatistics() {
		//build the XHR
		let xhr = new XMLHttpRequest();

		xhr.onreadystatechange = () => {
			if (xhr.readyState === 4) {
				if (xhr.status === 200) {
					let data = JSON.parse(xhr.responseText);
					this.setState({ statistics: data });
				}
			}
		}

		xhr.open('POST', '/equipmentstatisticsrequest', true);
		xhr.send();
	}

	fetchEquipmentList(username = this.props.username, token = this.props.token) {
		//build the XHR
		let xhr = new XMLHttpRequest();

		xhr.onreadystatechange = () => {
			if (xhr.readyState === 4) {
				if (xhr.status === 200) {
					let data = JSON.parse(xhr.responseText);
					this.setState({ equipment: data });
				}
			}
		}

		xhr.open('POST', '/equipmentlistrequest', true);
		xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
		xhr.send(JSON.stringify({
			username: username,
			token: token
		}));
	}
};

Equipment.propTypes = {
	username: PropTypes.string.isRequired,
	token: PropTypes.number.isRequired,
	scientists: PropTypes.number.isRequired,

	getFetchStatistics: PropTypes.func,
	getFetchEquipmentList: PropTypes.func
};

export default Equipment;