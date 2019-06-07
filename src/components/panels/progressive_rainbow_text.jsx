import React from 'react';

class ProgressiveRainbowText extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			colors: props.colors || ['red', 'orange', 'yellow', 'green', 'blue', 'violet', 'indigo'],
			counter: 0,
			unsubscribeKey: setInterval(() => this.setState({ counter: this.state.counter + 1}), 1000)
		}
	}

	componentWillUnmount() {
		clearInterval(this.state.unsubscribeKey);
	}

	render() {
		return (
			<p {...this.props}>
				{Object.keys(this.props.children).map((key) => <span key={key} style={{ color: this.state.colors[(key + this.state.counter) % this.state.colors.length] }}>{this.props.children[key]}</span>)}
			</p>
		);
	}
};

export default ProgressiveRainbowText;