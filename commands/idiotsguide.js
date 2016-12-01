exports.run = function(client, message) {
	let embed = {
		color: 0xdd2825,
		description: 'Introducing a basic how to guide on creating and running a discord.js bot, _"An Idiot\'s Guide"_ is catered to the fresh faced discord bot developers, a new video every week(ish) but be-warned, I like to curse like a sailor, so it’s NSFW-ish and is recommended for the mature viewer.',
		fields: [{
			name: '❯ Channel Link',
			value: '[An Idiot\'s Guide](https://www.youtube.com/channel/UCLun-hgcYUgNvCCj4sIa-jA)',
			inline: true
		}, {
			name: '❯ Subscribe',
			value: '[Click Here](https://www.youtube.com/channel/UCLun-hgcYUgNvCCj4sIa-jA?sub_confirmation=1)',
			inline: true
		}, {
			name: '\u200B',
			value: '\u200B',
			inline: true
		}, {
			name: '❯ Episode 1',
			value: '[Getting Started](https://www.youtube.com/watch?v=rVfjZrqoQ7o)\n',
			inline: true
		}, {
			name: '❯ Episode 2',
			value: '[Multiple Commands](https://www.youtube.com/watch?v=8AiZBdcPKOM)\n',
			inline: true
		}, {
			name: '❯ Episode 3',
			value: '[Guild Events](https://www.youtube.com/watch?v=oDJrtA1YORw)\n',
			inline: true
		}, {
			name: '❯ Episode 4',
			value: 'Client Events\n',
			inline: true
		}, {
			name: '❯ Episode 5',
			value: '???????????\n',
			inline: true
		}, {
			name: '❯ Episode 6',
			value: '???????????\n',
			inline: true
		}, {
			name: '❯ Playlists',
			value: '\u200B',
			inline: true
		}, {
			name: 'Discord.js',
			value: '[Watch Now](https://www.youtube.com/playlist?list=PLR2_rarYLHfg6ZJqq0WTMmI9uLcd7_GRO)',
			inline: true
		}, {
			name: 'Hosting',
			value: '[Watch Now](https://www.youtube.com/playlist?list=PLR2_rarYLHfjr6tzXXSFO0o326dQlnxUB)',
			inline: true
		}, {
			name: '\u200B',
			value: '\u200B'
		}],
		footer: {
			icon_url: client.user.avatarURL, // eslint-disable-line camelcase
			text: 'An Idiot\'s Guide'
		}
	};
	message.delete().then(message.channel.sendMessage('', {embed}).catch(error => console.log(error))).catch(error => console.log(error));
};
