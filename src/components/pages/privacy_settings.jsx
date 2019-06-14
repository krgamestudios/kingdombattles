import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

//panels
import CommonLinks from '../panels/common_links.jsx';
import PrivacySettingsPanel from '../panels/privacy_settings.jsx';

class PrivacySettings extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			message: '',
			warning: '' //TODO: unified warning?
		};
	}

	componentDidMount() {
		if (!this.props.loggedIn) {
			this.props.history.replace('/login');
		}
	}

	render() {
		let warningStyle = {
			display: this.state.warning.length > 0 ? 'flex' : 'none'
		};

		let Panel;

		if (this.state.message) {
			Panel = () => <p className='centered'>{this.state.message}</p>
		} else {
			Panel = () => <PrivacySettingsPanel id={this.props.id} token={this.props.token} onSuccess={(msg) => this.setState({message: msg})} setWarning={this.setWarning.bind(this)} />;
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

						<h1 className='centered'>Privacy Settings</h1>
						<Panel />
					</div>
				</div>
			</div>
		);
	}

	setWarning(s) {
		this.setState({ warning: s });
	}
};

PrivacySettings.propTypes = {
	loggedIn: PropTypes.bool.isRequired,
	id: PropTypes.number.isRequired,
	token: PropTypes.number.isRequired
};

const mapStoreToProps = (store) => {
	return {
		loggedIn: store.account.id !== 0,
		id: store.account.id,
		token: store.account.token
	};
};

const mapDispatchToProps = (dispatch) => {
	return {
		//
	};
};

PrivacySettings = connect(mapStoreToProps, mapDispatchToProps)(PrivacySettings);


export default PrivacySettings;