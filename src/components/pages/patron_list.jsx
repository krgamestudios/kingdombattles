import React from 'react';
import ReactMarkdown from 'react-markdown/with-html';

//panels
import CommonLinks from '../panels/common_links.jsx';

class PatronList extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			data: '',
			warning: ''
		};

		this.sendRequest('/content/patron_list.md');
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

						<h1 className='centered'>My Patrons On Patreon</h1>
						<p className='centered'>You can become a patron <a href='https://www.patreon.com/krgamestudios'>here</a>.</p>
						{this.state ? <ReactMarkdown source={this.state.data} escapeHtml={false} /> : <p>Loading patron list...</p>}
					</div>
				</div>
			</div>
		);
	}

	sendRequest(url, args = {}) {
		//build the XHR
		let xhr = new XMLHttpRequest();
		xhr.open('GET', url, true);

		xhr.onreadystatechange = () => {
			if (xhr.readyState === 4) {
				if (xhr.status === 200) {
					//on success
					this.setState({ data: xhr.responseText });
				}
				else {
					this.setWarning(xhr.responseText);
				}
			}
		};

		xhr.send();
	}

	setWarning(s) {
		this.setState({ warning: s });
	}
};

export default PatronList;