import React from 'react';
import { withRouter, Link } from 'react-router-dom';
import PropTypes from 'prop-types';

class PagedLadder extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			data: {}
		}

		if (props.getFetch) {
			props.getFetch(this.fetchLadder.bind(this));
		}

		this.fetchLadder();
	}

	render() {
		return (
			<div className='table'>
				<div className='row'>
					<p className='col'>Username</p>
					<p className='col'>Soldiers</p>
					<p className='col'>Recruits</p>
					<p className='col'>Gold</p>
				</div>
				{Object.keys(this.state.data).map((key) => <div key={key} className={'row'}> <Link to={`/profile?username=${this.state.data[key].username}`} className={'col'}>{this.state.data[key].username}</Link><p className={'col'}>{this.state.data[key].soldiers}</p><p className={'col'}>{this.state.data[key].recruits}</p><p className={'col'}>{this.state.data[key].gold}</p></div> )}
			</div>
		);
	}

	fetchLadder(start = this.props.start, length = this.props.length) {
		//build the XHR
		let xhr = new XMLHttpRequest();

		xhr.onreadystatechange = () => {
			if (xhr.readyState === 4) {
				if (xhr.status === 200) {
					let data = JSON.parse(xhr.responseText);
					this.setState({data: data});

					if (this.props.onReceived) {
						this.props.onReceived(data);
					}
				}
			}
		}

		xhr.open('POST', '/ladderrequest', true);
		xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
		xhr.send(JSON.stringify({
			start: start,
			length: length
		}));
	}
}

PagedLadder.propTypes = {
	start: PropTypes.number.isRequired,
	length: PropTypes.number.isRequired,
	getFetch: PropTypes.func,
	onReceived: PropTypes.func
};

export default withRouter(PagedLadder);