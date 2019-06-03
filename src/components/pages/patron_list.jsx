import React from 'react';
import ReactMarkdown from 'react-markdown/with-html';

//panels
import CommonLinks from '../panels/common_links.jsx';
import Markdown from '../panels/markdown.jsx';

class PatronList extends React.Component {
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

						<h1 className='centered'>My Patrons On Patreon</h1>
						<p className='centered'>You can become a patron <a href='https://www.patreon.com/krgamestudios'>here</a>.</p>
						<Markdown url='/content/patron_list.md' setWarning={this.setWarning.bind(this)} />
					</div>
				</div>
			</div>
		);
	}

	setWarning(s) {
		this.setState({ warning: s });
	}
};

export default PatronList;