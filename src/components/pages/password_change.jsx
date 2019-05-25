import React from 'react';
import { withRouter, Link } from 'react-router-dom';
import { connect } from 'react-redux';

//panels
import PasswordChangePanel from '../panels/password_change.jsx';

class PasswordChange extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			changeSent: false,
			changeMsg: ''
		}
	}

	componentDidMount() {
		if (!this.props.id) {
			this.props.history.push('/');
		}
	}

	render() {
		let Panel;

		if (!this.state.changeSent) {
			Panel = () => {
				return (<PasswordChangePanel onPasswordChange={(msg) => this.setState({ changeSent: true, changeMsg: msg }) } />);
			}
		} else {
			Panel = () => {
				return (<p>{this.state.changeMsg}</p>);
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

PasswordChange = connect(mapStoreToProps, mapDispatchToProps)(PasswordChange);

export default withRouter(PasswordChange);