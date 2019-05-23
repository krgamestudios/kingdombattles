import React from 'react';
import { withRouter, Link } from 'react-router-dom';

import Logout from './logout.jsx';

class CommonLinks extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			//
		}
	}

	render() {
		let Extra;

		if (this.props.extra) {
			Extra = this.props.extra;
		} else {
			Extra = () => null;
		}

		return (
			<div className='panel'>
				<p>Return <Link to='/' onClick={this.props.onClickHome}>home</Link></p>
				<p>Go to <Link to='/profile' onClick={this.props.onClickProfile}>your profile</Link></p>
				<p>Go to <Link to='/ladder' onClick={this.props.onClickLadder}>the game ladder</Link></p>

				<Extra />

				<Logout onClick={() => this.props.history.push('/')} />
			</div>
		);
	}
}

export default withRouter(CommonLinks);