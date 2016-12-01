const Discord = require('discord.js'),
	client = new Discord.Client({
		fetchAllMembers: true
	}),
	assistant = new Discord.Client({
		fetchAllMembers: true
	});
const winston = require('winston');
const sql = require('sqlite');
sql.open('./selfbot.sqlite');
client.sql = sql;
const settings = require('./settings.json');
client.settings = settings;
winston.add(winston.transports.File, {
	filename: 'logs/selfbot.log'
});
winston.remove(winston.transports.Console);

var date = new Date().toLocaleDateString();
client.date = date;
var time = new Date().toLocaleTimeString();
client.time = time;
var log = (message) => {
	client.channels.get(settings.logchannel).sendMessage(message).catch(error => console.log(error));
};

client.on('ready', () => {
	delete client.user.email;
	delete client.user.verified;
	let bootup = [
		'```xl',
		'BOOT TIME STATISTICS',
		`• Booted	 : ${date} @ ${time}`,
		`• Users	: ${client.users.size}`,
		`• Servers	: ${client.guilds.size}`,
		`• Channels : ${client.channels.size}`,
		'```'
	];
	log(bootup);
});

client.on('message', message => {

	if (message.isMentioned(client.user.id)) {
		assistant.channels.get(settings.mention).sendMessage(`Sir, you have a mention from **${message.author.username}**, from the _${message.channel}_ channel located on the _${message.guild}_ guild.\n\u200B`, {
			embed:{
				color: 3447003,
				author: {
					name: message.author.username,
					icon_url: message.author.avatarURL
				},
				description: `${message.cleanContent.replace('@York ', '').replace('@York,', '')}`,
				timestamp: new Date(),
				footer: {
					icon_url: client.user.avatarURL,
					text: '© Example'
				}
			}
		});
	}
	if (message.author.id !== client.user.id) return;
	if (!message.content.startsWith(settings.prefix)) return;

	const args = message.content.split(' ');
	const command = args.shift().slice(settings.prefix.length);

	try {
		let cmdFile = require('./commands/' + command);
		cmdFile.run(client, message, args);
	} catch (e) {
		log(e);
		console.log(`Command ${command} failed\n ${e.stack}`);
	}
});

client.on('message', message => {
	if (message.content.split(' ').length === 1) {
		sql.get('SELECT * FROM shortcuts WHERE name = ?', [message.content.slice(1)]).then(row => {
			if (!row) return;
			message.edit(row.contents);
		});
	}
});

client.on('reconnecting', () => {
	let date = new Date().toLocaleDateString();
	let time = new Date().toLocaleTimeString();
	log(`Reconnected at ${date} @ ${time}`);
});

client.on('disconnect', () => {
	let date = new Date().toLocaleDateString();
	let time = new Date().toLocaleTimeString();
	console.log(`Disconnected on the ${date}, at ${time}, attempting to reconnect`);
});


// Catch discord.js errors and remove client token,
// Uncomment one below, comment the other out.
// var token = /[\w\d]{24}\.[\w\d]{6}\.[\w\d-_]{27}/g; // !2FA tokens
var token = /((?:mfa.[\w-]+))/g; // 2FA Tokens
client.on('error', e => {
	winston.error(e.replace(token, 'that was redacted'));
});
client.on('warn', e => {
	winston.warn(e.replace(token, 'that was redacted'));
});
client.on('debug', e => {
	winston.info(e.replace(token, 'that was redacted'));
});
client.on('error', (e) => console.log(e.data));
client.ws.on('close', (e) => console.log(e.data));

assistant.on('message', amessage => {
	if (amessage.author.id !== client.user.id) return;
});

assistant.login(settings.assistant);
client.login(settings.token).catch(error => console.log(error));

process.on('unhandledRejection', err => {
	console.log('Uncaught Promise Error: \n' + err);
});
