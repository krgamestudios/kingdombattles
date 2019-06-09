import React from 'react';
import PropTypes from 'prop-types';
import ReactMarkdown from 'react-markdown/with-html';

class Markdown extends React.Component {
	constructor(props) {
		super(props);

		if (this.props.source) {
			this.state = {
				data: this.props.source
			};
		} else {
			this.state = {
				data: ''
			};
			this.sendRequest(props.url);
		}
	}

	render() {
		if (this.state.data) {
			return (<ReactMarkdown source={this.state.data} escapeHtml={false} {...this.props} />);
		} else {
			return (<p className='centered'>Loading markdown...</p>);
		}
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
				else if (this.props.setWarning) {
					this.props.setWarning(xhr.responseText);
				}
			}
		};

		xhr.send();
	}
};

Markdown.propTypes = {
	source: PropTypes.string,
	url: PropTypes.string,
	setWarning: PropTypes.func
};

export default Markdown;