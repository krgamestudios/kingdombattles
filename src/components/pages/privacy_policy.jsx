import React from 'react';

//panels
import CommonLinks from '../panels/common_links.jsx';
import MarkdownPanel from '../panels/markdown.jsx';

class PrivacyPolicy extends React.Component { //NOTE: react isn't liking the generic markdown_page.jsx class
	constructor(props) {
		super(props);
		this.state = {
			warning: '' //TODO: unified warning?
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

						<MarkdownPanel url={'/content/privacy_policy.md'} />
					</div>
				</div>
			</div>
		);
	}

	setWarning(s) {
		this.setState({ warning: s });
	}
};

export default PrivacyPolicy;