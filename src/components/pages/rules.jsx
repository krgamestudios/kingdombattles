import React from 'react';

//panels
import CommonLinks from '../panels/common_links.jsx';
import Markdown from '../panels/markdown.jsx';

class Rules extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			warning: '', //TODO: unified warning?
			fetch: null
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

						<Markdown url='/content/rules.md' setWarning={this.setWarning.bind(this)} />
					</div>
				</div>
			</div>
		);
	}

	setWarning(s) {
		this.setState({ warning: s });
	}
};

export default Rules;