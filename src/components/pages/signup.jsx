import React from 'react';
import { withRouter, Link } from 'react-router-dom';

//panels
import SignupPanel from '../panels/signup.jsx';

class Signup extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			signedUp: ''
		}

		//TODO: referral links
	}

	render() {
		let Panel;

		if (!this.state.signedUp) {
			Panel = () => {
				return (<SignupPanel onSuccess={ (msg) => this.setState({signedUp: msg}) } />);
			}
		} else {
			Panel = () => {
				return (<p className='centered'>{this.state.signedUp}</p>);
			}
		}

		return (
			<div className='page constrained'>
				<Panel />
				<Link to='/' className='centered'>Return Home</Link>
				<div className='break' />
				<p className='centered'>Remember to verify your email!</p>
				<div className='break' />
				<p className='centered'>Check our rules concerning<br /><Link to='/rules'>conduct in this game</Link>.</p>
			</div>
		);
	}
};

export default withRouter(Signup);