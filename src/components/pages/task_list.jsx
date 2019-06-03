import React from 'react';
import ReactMarkdown from 'react-markdown/with-html';

//panels
import CommonLinks from '../panels/common_links.jsx';
import Markdown from '../panels/markdown.jsx';

class TaskList extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			warning: ''
		};
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
						<Markdown url='/content/task_list.md' setWarning={this.setWarning.bind(this)} />
					</div>
				</div>
			</div>
		);
	}

	setWarning(s) {
		this.setState({ warning: s });
	}
};

export default TaskList;