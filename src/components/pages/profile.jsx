import React from 'react';
import { withRouter, Link } from 'react-router-dom';
import { connect } from 'react-redux';
import queryString from 'query-string';

//actions
import { storeProfile, clearProfile } from '../../actions/profile.js';

//panels
import CommonLinks from '../panels/common_links.jsx';
import AttackButton from '../panels/attack_button.jsx';
import Markdown from '../panels/markdown.jsx';
import BadgeText from '../panels/badge_text.jsx';

class Profile extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			params: queryString.parse(props.location.search),
			warning: '', //TODO: unified warning?
		};

		this.sendRequest('/profilerequest', {username: this.state.params.username ? this.state.params.username : this.props.account.username});
	}

	componentWillUnmount() {
		this.props.clearProfile();
	}

	render() {
		let warningStyle = {
			display: this.state.warning.length > 0 ? 'flex' : 'none'
		};

		//side panel stuff
		let SidePanel;

		if (this.props.account.id) {
			if (this.props.account.username === this.props.profile.username) {
				SidePanel = this.MyProfileSidePanel.bind(this);
			} else {
				SidePanel = this.NotMyProfileSidePanel.bind(this);
			}
		} else { //logged out
			SidePanel = this.LoggedOutSidePanel.bind(this);
		}

		//main panel
		let MainPanel;

		if (this.props.account.id) {
			//logged in
			if (this.props.account.username === this.props.profile.username) {
				MainPanel = this.MyProfileMainPanel.bind(this);
			} else {
				if (this.props.profile.username) {
					MainPanel = this.NotMyProfileMainPanel.bind(this);
				} else {
					MainPanel = this.ProfileNotFoundMainPanel.bind(this);
				}
			}
		} else {
			//not logged in
			if (this.props.profile.username) {
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
	sendRequest(url, args = {}) { //send a unified request, using my credentials
		//build the XHR
		let xhr = new XMLHttpRequest();
		xhr.open('POST', url, true);

		xhr.onreadystatechange = () => {
			if (xhr.readyState === 4) {
				if (xhr.status === 200) {
					let json = JSON.parse(xhr.responseText);

					this.props.storeProfile(
						json.username,
						json.gold,
						json.recruits,
						json.soldiers,
						json.spies,
						json.scientists,
						json.activeBadge,
						json.activeBadgeFilename
					);
				}
				else if (xhr.status === 400) {
					this.setWarning(xhr.responseText);
				}
			}
		};

		xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
		xhr.send(JSON.stringify({
			id: this.props.account.id,
			token: this.props.account.token,
			...args
		}));
	}

	//panel functions
	MyProfileSidePanel() {
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
						<BadgeText name={this.props.profile.activeBadge} filename={this.props.profile.activeBadgeFilename} size={'small'} className='col'>{this.props.profile.username}</BadgeText>

						<div className='col'></div>
						<div className='col'></div>
					</div>

					<div className='row'>
						<p className='col'>Gold:</p>
						<p className='col'>{this.props.profile.gold}</p>

						<p className='col truncate' style={{flex: '2 1 2%'}}>(+1 gold for each recruit every half hour)</p>
					</div>

					<div className='row'>
						<p className='col'>Recruits:</p>
						<p className='col'>{this.props.profile.recruits}</p>

						<button className='col' style={{flex: '2 1 2%'}} onClick={ () => this.sendRequest('/recruitrequest') }>Recruit More Units</button>
					</div>

					<div className='row'>
						<p className='col'>Soldiers:</p>
						<p className='col'>{this.props.profile.soldiers}</p>

						<button className='col' onClick={ () => this.sendRequest('/trainrequest', {role: 'soldier'}) }>Train Soldier (100 gold)</button>
						<button className='col' onClick={ () => window.confirm('Are you sure you want to untrain? (you won\'t get your gold back!)') && this.sendRequest('/untrainrequest', {role: 'soldier'}) }>Untrain Soldier</button>
					</div>

					<div className='row'>
						<p className='col'>Scientists:</p>
						<p className='col'>{this.props.profile.scientists}</p>

						<button className='col' onClick={ () => this.sendRequest('/trainrequest', {role: 'scientist'}) }>Train Scientist (120 gold)</button>
						<button className='col' onClick={ () => window.confirm('Are you sure you want to untrain? (you won\'t get your gold back!)') && this.sendRequest('/untrainrequest', {role: 'scientist'}) }>Untrain Scientist</button>
					</div>

					<div className='row'>
						<p className='col'>Spies:</p>
						<p className='col'>{this.props.profile.spies}</p>

						<button className='col' onClick={ () => this.sendRequest('/trainrequest', {role: 'spy'}) }>Train Spy (300 gold)</button>
						<button className='col' onClick={ () => window.confirm('Are you sure you want to untrain? (you won\'t get your gold back!)') && this.sendRequest('/untrainrequest', {role: 'spy'}) }>Untrain Spy</button>
					</div>
				</div>

				<div className='break' />

				<Markdown url='/content/instructions.md' setWarning={this.setWarning.bind(this)} />
			</div>
		);
	}

	NotMyProfileSidePanel() {
		//return the side panel
		return (
			<div className='sidePanel'>
				<CommonLinks onClickProfile={(e) => {
					e.preventDefault();
					this.sendRequest('/profilerequest', {username: this.props.account.username});
					this.setWarning('');
					this.props.history.push('/profile');
				}} />
			</div>
		);
	}

	NotMyProfileMainPanel() {
		return (
			<div className='panel'>
				<h1 className='centered'>{this.props.profile.username}'s Kingdom</h1>
				<div className='table noCollapse'>
					<div className='row'>
						<p className='col'>Username:</p>
						<BadgeText name={this.props.profile.activeBadge} filename={this.props.profile.activeBadgeFilename} size={'small'} className='col'>{this.props.profile.username}</BadgeText>

						<div className='col' />
						<div className='col' />
					</div>

					<div className='row'>
						<p className='col'>Gold:</p>
						<p className='col'>{this.props.profile.gold}</p>

						<div className='col' />
						<div className='col' />
					</div>

					<div className='row'>
						<p className='col'>Recruits:</p>
						<p className='col'>{this.props.profile.recruits}</p>

						<AttackButton
							className='col'
							style={{flex: '2 1 2%'}}
							setWarning={this.setWarning.bind(this)}
							attacker={this.props.account.username}
							defender={this.props.profile.username}
							statusRequest={'/attackstatusrequest'}
							attackRequest={'/attackrequest'}
							pendingStatus={'attacking'}
							pendingMsg={'Your soldiers are attacking'}
							parseUnits={(json) => json.soldiers}
						>Attack</AttackButton>
					</div>

					<div className='row'>
						<p className='col'>Soldiers:</p>
						<p className='col'>{this.props.profile.soldiers}</p>

						<AttackButton
							className='col'
							style={{flex: '2 1 2%'}}
							setWarning={this.setWarning.bind(this)}
							attacker={this.props.account.username}
							defender={this.props.profile.username}
							statusRequest={'/spystatusrequest'}
							attackRequest={'/spyrequest'}
							pendingStatus={'spying'}
							pendingMsg={'Your spies are spying on'}
							parseUnits={(json) => json.spies}
						>Send Spies</AttackButton>
					</div>

					<div className='row'>
						<p className='col'>Scientists:</p>
						<p className='col'>{this.props.profile.scientists}</p>

						<div className='col' />
						<div className='col' />
					</div>

					<div className='row'>
						<p className='col'>Spies:</p>
						<p className='col'>{this.props.profile.spies}</p>

						<div className='col' />
						<div className='col' />
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
				<h1 className='centered'>{this.props.profile.username}'s Kingdom</h1>
				<div className='table noCollapse'>
					<div className='row'>
						<p className='col'>Username:</p>
						<BadgeText name={this.props.profile.activeBadge} filename={this.props.profile.activeBadgeFilename} size={'small'} className='col'>{this.props.profile.username}</BadgeText>

						<div className='col' />
						<div className='col' />
					</div>

					<div className='row'>
						<p className='col'>Gold:</p>
						<p className='col'>{this.props.profile.gold}</p>

						<div className='col' />
						<div className='col' />
					</div>

					<div className='row'>
						<p className='col'>Recruits:</p>
						<p className='col'>{this.props.profile.recruits}</p>

						<div className='col' />
						<div className='col' />
					</div>

					<div className='row'>
						<p className='col'>Soldiers:</p>
						<p className='col'>{this.props.profile.soldiers}</p>

						<div className='col' />
						<div className='col' />
					</div>

					<div className='row'>
						<p className='col'>Scientists:</p>
						<p className='col'>{this.props.profile.scientists}</p>

						<div className='col' />
						<div className='col' />
					</div>

					<div className='row'>
						<p className='col'>Spies:</p>
						<p className='col'>{this.props.profile.spies}</p>

						<div className='col' />
						<div className='col' />
					</div>
				</div>
			</div>
		);
	}

	ProfileNotFoundMainPanel() {
		return (
			<div className='page'>
				<p className='centered'>Profile Not Found!</p>
			</div>
		);
	}

	setWarning(s) {
		this.setState({ warning: s });
	}
};

const mapStoreToProps = (store) => {
	return {
		account: store.account,
		profile: store.profile,
	};
};

const mapDispatchToProps = (dispatch) => {
	return {
		storeProfile: (username, gold, recruits, soldiers, spies, scientists, activeBadge, activeBadgeFilename) => dispatch(storeProfile(username, gold, recruits, soldiers, spies, scientists, activeBadge, activeBadgeFilename)),
		clearProfile: () => dispatch(clearProfile())
	};
};

Profile = connect(mapStoreToProps, mapDispatchToProps)(Profile);

export default withRouter(Profile);