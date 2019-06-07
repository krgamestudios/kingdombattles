import React from 'react';
import PropTypes from 'prop-types';

class Statistics extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			data: {}
		};

		if (props.getFetch) {
			props.getFetch(() => this.sendRequest('/statisticsrequest'));
		}
	}

	render() {
		return (
			<div className='panel table noCollapse'>
				{Object.keys(this.state.data).map((key) => <div key={key} className='row'>
					<p className='col'>{key}:</p>
					<p className='col'>{typeof(this.state.data[key]) === 'object' ? <span style={{color: this.state.data[key].color}}>{this.state.data[key].string}</span> : <span>{this.state.data[key]}</span>}</p>
					<div className='col mobile hide' />
				</div>)}
			</div>
		);
	}

	sendRequest(url, args = {}) { //send a unified request, using my credentials
		//TODO: move sendRequest() into it's own module
		//build the XHR
		let xhr = new XMLHttpRequest();
		xhr.open('POST', url, true);

		xhr.onreadystatechange = () => {
			if (xhr.readyState === 4) {
				if (xhr.status === 200) {
					let json = JSON.parse(xhr.responseText);

					//on success
					this.setState({ data: json });
				}
				else if (xhr.status === 400 && this.props.setWarning) {
					this.props.setWarning(xhr.responseText);
				}
			}
		};

		xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
		xhr.send(JSON.stringify({
			//NOTE: No id or token needed for statistics
			...args
		}));
	}
};

Statistics.propTypes = {
	setWarning: PropTypes.func,
	getFetch: PropTypes.func
};

export default Statistics;