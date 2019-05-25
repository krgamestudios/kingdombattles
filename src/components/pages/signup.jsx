import React from 'react';
import { withRouter, Link } from 'react-router-dom';

//panels
import SignupPanel from '../panels/signup.jsx';

class Signup extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			signupSent: false,
			signupMsg: ''
		}

		//TODO: referral links
	}

	render() {
		let Panel;

		if (!this.state.signupSent) {
			Panel = () => {
				return (<SignupPanel onSignup={(msg) => this.setState( {signupSent: true, signupMsg: msg} )} />);
			}
		} else {
			Panel = () => {
				return (<p>{this.state.signupMsg}</p>);
			}
		}

		return (
			<div className='page constrained'>
				<Panel />
				<Link to='/' className='centered'>Return Home</Link>
			</div>
		);
	}
};

export default withRouter(Signup);