import React from 'react';

//panels
import CommonLinks from '../panels/common_links.jsx';
import NewsPanel from '../panels/news.jsx';

class News extends React.Component {
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

						<NewsPanel
							setWarning={this.setWarning.bind(this)}
							getFetch={ (fn) => this.setState({ fetch: fn }) }
							postId={this.props.match.params.postId}
						/>
					</div>
				</div>
			</div>
		);
	}

	setWarning(s) {
		this.setState({ warning: s });
	}
};

export default News;