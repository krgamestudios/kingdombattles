import React from 'react';
import ReactMarkdown from 'react-markdown';

class NewsPanel extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			data: {}
		};

		this.fetchNews();
	}

	render() {
		return (
			<div>
				{Object.keys(this.state.data).map((key, index) => <div key={key}><ReactMarkdown source={this.state.data[key]} escapeHTML={false} /><hr /></div> )}
			</div>
		);
	}

	fetchNews() {
		//build the XHR
		let xhr = new XMLHttpRequest();

		xhr.onreadystatechange = () => {
			if (xhr.readyState === 4) {
				if (xhr.status === 200) {
					this.setState({data: JSON.parse(xhr.responseText)});
				}
			}
		}

		xhr.open('POST', '/newsrequest', true);
		xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
		xhr.send(JSON.stringify({
			max: 3
		}));
	}
};

export default NewsPanel;