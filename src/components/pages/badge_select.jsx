import React from 'react';
import { withRouter, Link } from 'react-router-dom';
import { connect } from 'react-redux';

//panels
import CommonLinks from '../panels/common_links.jsx';
import BadgeSelectPanel from '../panels/badge_select.jsx';

class BadgeSelect extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			warning: '', //TODO: unified warning?
			fetch: null
		};
	}

	componentDidMount() {
		if (!this.props.loggedIn) {
			this.props.history.replace('/login');
		}
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

						<h1 className='centered'>Badge Select</h1>
						<p className='centered'>Click on your favourite badge! <Link to='/badges/list'>Full list here</Link>.</p>
						<BadgeSelectPanel setWarning={this.setWarning.bind(this)} getFetch={ (fn) => this.setState({ fetch: fn }) } />
					</div>
				</div>
			</div>
		);
	}

	setWarning(s) {
		this.setState({ warning: s });
	}
};

const mapStoreToProps = (store) => {
	return {
		loggedIn: store.account.id !== 0
	};
};

const mapDispatchToProps = (dispatch) => {
	return {
		//
	};
};

BadgeSelect = connect(mapStoreToProps, mapDispatchToProps)(BadgeSelect);


export default withRouter(BadgeSelect);