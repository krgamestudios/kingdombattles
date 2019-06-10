import React from 'react';

class Badge extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			//
		};
	}

	render() {
		if (!this.props.filename) {
			return null;
		}

		let realSize = typeof(this.props.size) === 'number' ? this.props.number : this.parseSize(this.props.size);

		return (
			<img {...this.props} src={`/img/badges/${this.props.filename}`} alt={this.props.name} title={this.props.name} width={realSize} height={realSize} style={{ minWidth: realSize, minHeight: realSize }} />
		);
	}

	parseSize(sizeString) {
		if (sizeString === 'small') return 20;
		if (sizeString === 'medium') return 50;
		return 100;
	}
};

export default Badge;