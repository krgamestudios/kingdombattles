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
			fetch: null,
			tagline: ''
		};

		fetch('/taglinerequest')
			.then(res => res.text())
			.then(text => this.setState({ tagline: text }))
			.catch(console.error)
		;
	}

	componentDidUpdate(prevProps, prevState, snapshot) {
		this.state.fetch();
	}

	render() {
		let warningStyle = {
			display: this.state.warning.length > 0 ? 'flex' : 'none'
		};

		//A bit of fun
		let Tagline = () => {
			if (this.state.tagline === 'marquee') {
				return (<p className='marquee'><em>I hope this CSS marquee effect works in all browsers!</em></p>);
			}
			if (this.state.tagline === 'rainbow') {
				return (<p className='centered rainbowText'><em>I hope this CSS rainbow effect works in all browsers!</em></p>);
			}
			return (<p className='centered'><em><Markdown source={this.state.tagline} escapeHtml={true} /></em></p>);
		}

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
						<Tagline />
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