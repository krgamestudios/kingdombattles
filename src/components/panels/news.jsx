import React from 'react';
import ReactMarkdown from 'react-markdown/with-html';
import PropTypes from 'prop-types';

class News extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			//TODO: data?
		};

		if (props.getFetch) {
			props.getFetch( () => this.sendRequest('/newsrequest', {length: this.props.length || 10, postId: this.props.postId}) );
		}
	}

	render() {
		return (
			<div className='panel'>
				{Object.keys(this.state).map((key) => <div key={key}>
					<ReactMarkdown source={this.state[key]} escapeHtml={false} />
					<hr className='newsLine' />
				</div>)}
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
					this.setState(json);
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
};

News.propTypes = {
	length: PropTypes.number,
	setWarning: PropTypes.func,
	getFetch: PropTypes.func
};

export default News;