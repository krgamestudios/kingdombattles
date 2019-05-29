import React from 'react';
import { connect } from 'react-redux';
import { withRouter, Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import queryString from 'query-string';

//panels
import CommonLinks from '../panels/common_links.jsx';
import AttackButton from '../panels/attack_button.jsx';
import CombatLog from '../panels/combat_log.jsx';

class Profile extends React.Component {
	constructor(props) {
		super(props);

		let params = queryString.parse(props.location.search);

		this.state = {
			params: params,

			username: '',
			gold: 0,
			recruits: 0,
			soldiers: 0,
			spies: 0,
			scientists: 0,

			warning: '',

			start: params.log
		};

		this.sendRequest('/profilerequest', this.state.params.username ? this.state.params.username : this.props.username);
	}

	render() {
		let warningStyle = {
			display: this.state.warning.length > 0 ? 'flex' : 'none'
		};

		//side panel stuff
		let SidePanel;

		if (this.props.id) {
			if (this.props.username === this.state.username) {
				SidePanel = this.MyProfileSidePanel.bind(this);
			} else {
				SidePanel = this.NotMyProfileSidePanel.bind(this);
			}
		} else { //logged out
			SidePanel = this.LoggedOutSidePanel.bind(this);
		}

		//main panel
		let MainPanel;

		if (this.props.id) {
			//logged in
			if (this.state.username === this.props.username) {
				MainPanel = this.MyProfileMainPanel.bind(this);
			} else {
				//not logged in
				if (this.state.username !== '') {
					MainPanel = this.NotMyProfileMainPanel.bind(this);
				} else {
					MainPanel = this.ProfileNotFoundMainPanel.bind(this);
				}
			}
		} else {
			//not logged in
			if (this.state.username !== '') {
				MainPanel = this.LoggedOutMainPanel.bind(this);
			} else {
				MainPanel = this.ProfileNotFoundMainPanel.bind(this);
			}
		}

		//finally
		return (
			<div className='page'>
				<div className='sidePanelPage'>
					<SidePanel />

					<div className='mainPanel'>
						<div className='warning' style={warningStyle}>
							<p>{this.state.warning}</p>
						</div>

						<MainPanel />
					</div>
				</div>
			</div>
		);
	}

	//gameplay functions
	sendRequest(url, username = this.props.username, role = '') { //NOTE: merged all requests here
		//request this profile's info, using my credentials
		let formData = new FormData();

		formData.append('id', this.props.id);
		formData.append('token', this.props.token);

		formData.append('username', username);
		formData.append('role', role);

		//build the XHR
		let xhr = new XMLHttpRequest();
		xhr.onreadystatechange = () => {
			if (xhr.readyState === 4) {
				if (xhr.status === 200) {
					let json = JSON.parse(xhr.responseText);
					this.storeProfile(
						json.username,
						json.gold,
						json.recruits,
						json.soldiers,
						json.spies,
						json.scientists
					);
				}
				else if (xhr.status === 400) {
					this.setWarning(xhr.responseText);
				}
			}
		}

		//send
		xhr.open('POST', url, true);
		xhr.send(formData);
	}

	storeProfile(username, gold, recruits, soldiers, spies, scientists) {
		this.setState({
			username: username,
			gold: gold,
			recruits: recruits,
			soldiers: soldiers,
			spies: spies,
			scientists: scientists
		});
	}

	//panel functions
	MyProfileSidePanel() {
		//return the side panel
		return (
			<div className='sidePanel'>
				<CommonLinks />
			</div>
		);
	}

	MyProfileMainPanel() {
		return (
			<div className='panel'>
				<h1 className='centered'>Your Kingdom</h1>
				<div className='table noCollapse'>
					<div className='row'>
						<p className='col'>Username:</p>
						<p className='col'>{this.state.username}</p>
						<div className='col'></div>
						<div className='col'></div>
					</div>

					<div className='row'>
						<p className='col'>Gold:</p>
						<p className='col'>{this.state.gold}</p>
						<div className='col' style={{flex: '2 1 1.5%'}}>(+1 gold for each recruit every half hour)</div>
					</div>

					<div className='row'>
						<p className='col'>Recruits:</p>
						<p className='col'>{this.state.recruits}</p>
						<button className='col' style={{flex: '2 1 1.5%'}} onClick={() => this.sendRequest('/recruitrequest')}>Recruit More Units</button>
					</div>

					<div className='row'>
						<p className='col'>Soldiers:</p>
						<p className='col'>{this.state.soldiers}</p>
						<button className='col' onClick={() => this.sendRequest('/trainrequest', this.props.username, 'soldier')}>Train Soldier (100 gold)</button>
						<button className='col' onClick={() => this.sendRequest('/untrainrequest', this.props.username, 'soldier')}>Untrain Soldier</button>
					</div>

					<div className='row'>
						<p className='col'>Spies:</p>
						<p className='col'>{this.state.spies}</p>
						<button className='col' onClick={() => this.sendRequest('/trainrequest', this.props.username, 'spy')}>Train Spy (200 gold)</button>
						<button className='col' onClick={() => this.sendRequest('/untrainrequest', this.props.username, 'spy')}>Untrain Spy</button>
					</div>

					<div className='row'>
						<p className='col'>Scientists:</p>
						<p className='col'>{this.state.scientists}</p>
						<button className='col' onClick={() => this.sendRequest('/trainrequest', this.props.username, 'scientist')}>Train Scientist (120 gold)</button>
						<button className='col' onClick={() => this.sendRequest('/untrainrequest', this.props.username, 'scientist')}>Untrain Scientist</button>
					</div>
				</div>

				<br />
				<h1 className='centered'>Combat Log</h1>
				<CombatLog username={this.props.username} start={this.state.start} length={this.state.length} />
			</div>
		);
	}

	NotMyProfileSidePanel() {
		//return the side panel
		return (
			<div className='sidePanel'>
				<CommonLinks onClickProfile={() => {e.preventDefault(); this.sendRequest('/profilerequest', this.props.username); this.setWarning(''); this.props.history.push('/profile');}} />
			</div>
		);
	}

	NotMyProfileMainPanel() {
		return (
			<div className='panel'>
				<h1 className='centered'>{this.state.username}'s Kingdom</h1>
				<div className='table noCollapse'>
					<div className='row'>
						<p className='col'>Username:</p>
						<p className='col'>{this.state.username}</p>
						<div className='col'></div>
						<div className='col'></div>
					</div>

					<div className='row'>
						<p className='col'>Gold:</p>
						<p className='col'>{this.state.gold}</p>
						<div className='col'></div>
						<div className='col'></div>
					</div>

					<div className='row'>
						<p className='col'>Recruits:</p>
						<p className='col'>{this.state.recruits}</p>
						<AttackButton className='col' style={{flex: '2 1 1.5%'}} setWarning={this.setWarning.bind(this)} attacker={this.props.username} defender={this.state.username} token={this.props.token} />
					</div>

					<div className='row'>
						<p className='col'>Soldiers:</p>
						<p className='col'>{this.state.soldiers}</p>
						<div className='col'></div>
						<div className='col'></div>
					</div>

					<div className='row'>
						<p className='col'>Spies:</p>
						<p className='col'>{this.state.spies}</p>
						<div className='col'></div>
						<div className='col'></div>
					</div>

					<div className='row'>
						<p className='col'>Scientists:</p>
						<p className='col'>{this.state.scientists}</p>
						<div className='col'></div>
						<div className='col'></div>
					</div>
				</div>
			</div>
		);
	}

	LoggedOutSidePanel() {
		return (
			<div className='sidePanel'>
				<CommonLinks />
			</div>
		);
	}

	LoggedOutMainPanel() {
		return (
			<div className='panel'>
				<h1 className='centered'>{this.state.username}'s Kingdom</h1>
				<div className='table noCollapse'>
					<div className='row'>
						<p className='col'>Username:</p>
						<p className='col'>{this.state.username}</p>
						<div className='col'></div>
						<div className='col'></div>
					</div>

					<div className='row'>
						<p className='col'>Gold:</p>
						<p className='col'>{this.state.gold}</p>
						<div className='col'></div>
						<div className='col'></div>
					</div>

					<div className='row'>
						<p className='col'>Recruits:</p>
						<p className='col'>{this.state.recruits}</p>
						<div className='col'></div>
						<div className='col'></div>
					</div>

					<div className='row'>
						<p className='col'>Soldiers:</p>
						<p className='col'>{this.state.soldiers}</p>
						<div className='col'></div>
						<div className='col'></div>
					</div>

					<div className='row'>
						<p className='col'>Spies:</p>
						<p className='col'>{this.state.spies}</p>
						<div className='col'></div>
						<div className='col'></div>
					</div>

					<div className='row'>
						<p className='col'>Scientists:</p>
						<p className='col'>{this.state.scientists}</p>
						<div className='col'></div>
						<div className='col'></div>
					</div>
				</div>
			</div>
		);
	}

	ProfileNotFoundMainPanel() {
		return (
			<div className='page' />
		);
	}

	setWarning(s) {
		this.setState({
			warning: s
		});
	}
}

Profile.propTypes = {
	id: PropTypes.number.isRequired,
	email: PropTypes.string.isRequired,
	username: PropTypes.string.isRequired,
	token: PropTypes.number.isRequired
};

function mapStoreToProps(store) {
	return {
		id: store.account.id,
		email: store.account.email,
		username: store.account.username,
		token: store.account.token
	}
}

function mapDispatchToProps(dispatch) {
	return {
		//
	}
}

Profile = connect(mapStoreToProps, mapDispatchToProps)(Profile);

export default withRouter(Profile);