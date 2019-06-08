import React from 'react';
import { withRouter, Link } from 'react-router-dom';

//panels
import CommonLinks from '../panels/common_links.jsx';

class NewsIndex extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			data: {},
			warning: '' //TODO: unified warning?
		};

		this.sendRequest('/newsheadersrequest');
	}

	render() {
		let warningStyle = {
			display: this.state.warning.length > 0 ? 'flex' : 'none'
		};

		return (
			<div className='page'>
				<div className='sidePanelPage'>
					<div className='sidePanel'>
						<CommonLinks />
					</div>

					<div className='mainPanel'>
						<div className='warning' style={warningStyle}>
							<p>{this.state.warning}</p>
						</div>

						<ul className='panel'>
							{Object.keys(this.state.data).map((fname) => <li key={fname} style={{paddingBottom: '0.5em'}}><Link to={`/news/${fname}`}>{fname}</Link> - {this.state.data[fname].firstline}</li>).reverse()}
						</ul>
					</div>
				</div>
			</div>
		);
	}

	sendRequest(url, args = {}) { //send a unified request, using my credentials
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
			//NOTE: No id or token needed for the news
			...args
		}));
	}

	setWarning(s) {
		this.setState({ warning: s });
	}
};

export default withRouter(NewsIndex);