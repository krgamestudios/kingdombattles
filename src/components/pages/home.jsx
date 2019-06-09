import React from 'react';
import { withRouter, Link } from 'react-router-dom';

//panels
import CommonLinks from '../panels/common_links.jsx';
import Markdown from '../panels/markdown.jsx';
import News from '../panels/news.jsx';

class Home extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			warning: '', //TODO: unified warning?
			fetch: null
		};
	}

	componentDidUpdate(prevProps, prevState, snapshot) {
		this.state.fetch();
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

						<h1 className='centered'>About</h1>
						<p className='centered'><em>A game in <strike>early</strike> development.</em></p>
						<br />
						<Markdown url='/content/blurb.md' />
						<h1 className='centered'>News</h1>
						<News setWarning={this.setWarning.bind(this)} getFetch={ (fn) => this.setState({ fetch: fn }) } />
						<p className='right'><Link to='/news'>See all news...</Link></p>
					</div>
				</div>
			</div>
		);
	}

	setWarning(s) {
		this.setState({ warning: s });
	}
};

export default withRouter(Home);