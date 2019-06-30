import React from 'react';

class GoogleAdverts extends React.Component {
	comonentDidMount() {
		(adsbygoogle = window.adsbygoogle || []).push({});
	}

	shouldComponentUpdate() {
		return false;
	}

	render() {
		return (
			<div className='ad'>
				<ins className='adsbygoogle'
					style={{display: 'block'}}
					data-ad-client='ca-pub-3272796169678302'
					data-ad-slot='5669312895'
					data-ad-format='auto'
					data-full-width-responsive='true'
				/>
			</div>
		);
	}
};

export default GoogleAdverts;
