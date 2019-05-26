import React from 'react';
import { connect } from 'react-redux';
import { withRouter, Link } from 'react-router-dom';

//panels
import CommonLinks from '../panels/common_links.jsx';
import Blurb from '../panels/blurb.jsx';
import NewsPanel from '../panels/news_panel.jsx';

class Home extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			//
		};
	}

	//rendering function
	render() {
		//return the home page
		return (
			<div className='page'>
				<div className='sidePanelPage'>
					<div className='sidePanel'>
						<CommonLinks />
					</div>

					<div className='mainPanel'>
						<Blurb />
						<h1 className='centered'>News</h1>
						<NewsPanel />
					</div>
				</div>
			</div>
		);
	}
}

function mapStoreToProps(store) {
	return {
		id: store.account.id
	}
}

function mapDispatchToProps(dispatch) {
	return {
		//
	}
}

Home = connect(mapStoreToProps, mapDispatchToProps)(Home);

export default withRouter(Home);