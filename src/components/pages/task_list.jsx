import React from 'react';
import ReactMarkdown from 'react-markdown/with-html';

//panels
import CommonLinks from '../panels/common_links.jsx';

class TaskList extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			data: '',
			warning: ''
		};

		this.sendRequest('/content/task_list.md');
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

						<h1 className='centered'>Kingdom Battles Developer Task List</h1>
						{this.state ? <ReactMarkdown source={this.state.data} escapeHtml={false} /> : <p>Loading task list...</p>}
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

export default TaskList;