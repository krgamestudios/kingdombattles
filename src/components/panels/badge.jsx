import React from 'react';

class Badge extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			//
		};
	}

	render() {
		let realSize = typeof(this.props.size) === 'number' ? this.props.number : this.parseSize(this.props.size);

		return (
			<img {...this.props} src={`/img/badges/${this.props.filename}`} alt={this.props.name} width={realSize} height={realSize} />
		);
	}

	parseSize(sizeString) {
		if (sizeString === 'small') return 12;
		if (sizeString === 'medium') return 20;
		return 100;
	}
};

export default Badge;