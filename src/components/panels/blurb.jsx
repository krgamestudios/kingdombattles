import React from 'react';

export default class Blurb extends React.Component {
	render() {
		let Link = (props) => <a href={props.to}>{props.to}</a>;

		return (
			<div className='panel'>
				<p className='centered'><em>A game in early development.</em></p>
				<br />
				<p>This is a resource accumulation game, with some similarities to idle games. The idea is that you recruit new units once per day, train them as soldiers, and send them to attack other players. You can also train spies and scientists, which each grant their own benefits.</p>
				<p>You can follow the developer KR Game Studios here:</p>
				<ul>
					<li><Link to='https://facebook.com/KRGameStudios' /></li>
					<li><Link to='https://twitter.com/KRGameStudios' /></li>
					<li><Link to='https://discord.gg/FQmz8TN' /></li>
					<li><Link to='https://www.patreon.com/krgamestudios' /></li>
					<li><Link to='https://github.com/KRGameStudios' /></li>
				</ul>
			</div>
		);
	}
};

