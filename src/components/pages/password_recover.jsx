import React from 'react';
import { withRouter, Link } from 'react-router-dom';

//panels
import PasswordRecoverPanel from '../panels/password_recover.jsx';

class PasswordRecover extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			recoverSent: false,
			recoverMsg: ''
		}
	}

	render() {
		let Panel;

		if (!this.state.recoverSent) {
			Panel = () => {
				return (<PasswordRecoverPanel onEmailSent={(msg) => this.setState( {recoverSent: true, recoverMsg: msg} )} />);
			}
		} else {
			Panel = () => {
				return (<p>{this.state.recoverMsg}</p>);
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

export default withRouter(PasswordRecover);