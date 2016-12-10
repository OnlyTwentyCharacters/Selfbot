const Discord = require('discord.js'),
	client = new Discord.Client({
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
require('./util/clientEvents')(client);
// client.on('message', message => {
// 	if (message.isMentioned(client.user.id)) {
// 		console.log(`Just mentioned by ${message.author.username} (${message.author.id}) on ${message.guild.name}/${message.channel.name}:\n${message.cleanContent}`);
// 	}
//
// 	if (message.author.id !== client.user.id) return;
// 	if (!message.content.startsWith(settings.prefix)) return;
//
// 	const args = message.content.split(' ');
// 	const command = args.shift().slice(settings.prefix.length);
//
// 	try {
// 		let cmdFile = require('./commands/' + command);
// 		cmdFile.run(client, message, args);
// 	} catch (e) {
// 		log(e);
// 		console.log(`Command ${command} failed\n ${e.stack}`);
// 	}
// });
//
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
client.ws.on('close', (e) => console.log(e.data));

client.login(settings.token).catch(error => console.log(error));

process.on('unhandledRejection', err => {
	console.error('Uncaught Promise Error: \n' + err);
});
