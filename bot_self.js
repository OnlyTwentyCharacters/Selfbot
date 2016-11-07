const Discord = require('discord.js'),
	client = new Discord.Client({
		fetchAllMembers: true
	});
const winston = require('winston');
const sql = require('sqlite');

winston.add(winston.transports.File, {
	filename: 'logs/selfbot.log'
});
winston.remove(winston.transports.Console);

var cmdhandler = require('./bot_self_commands.js');
var date = new Date().toLocaleDateString();
var time = new Date().toLocaleTimeString();

var log = (message) => {
	client.channels.get(cmdhandler.settings.logchannel).sendMessage(message).catch(error => console.log(error.stack));
};

let unit = ['', 'K', 'M', 'G', 'T', 'P'];

function bytesToSize(input, precision) {
	let index = Math.floor(Math.log(input) / Math.log(1024));
	if (unit >= unit.length) return input + ' B';
	return (input / Math.pow(1024, index)).toFixed(precision) + ' ' + unit[index] + 'B';
}
let MemoryUsing = bytesToSize(process.memoryUsage().rss, 3);

client.on('ready', () => {
	let bootup = [
		'```xl',
		'BOOT TIME STATISTICS',
		`• Booted   : ${date} @ ${time}`,
		`• Users	: ${client.users.size}`,
		`• Servers  : ${client.guilds.size}`,
		`• Channels : ${client.channels.size}`,
		'```'
	];
	log(bootup);
});

client.on('message', message => {
	// Log mentions cuz fuck you that's why
	if (message.isMentioned(client.user.id)) {
		console.log(`Just mentioned by ${message.author.username} (${message.author.id}) on ${message.guild.name}/${message.channel.name}:\n${message.cleanContent}`);
	}
	const none2fa = /[\w\d]{24}\.[\w\d]{6}\.[\w\d-_]{27}/g;
	const full2fa = /((?:mfa.[\w-]+))/g;
	const match1 = message.content.match(none2fa);
	const match2 = message.content.match(full2fa);
	if (match1) console.log(`Token Detected: ${match1[0]}`);
	if (match2) console.log(`Token Detected: ${match2[0]}`);

	if (message.author !== client.user) return;
	if (!message.content.startsWith(cmdhandler.settings.prefix)) return;

	if (message.content.split(' ').length === 1) {
		sql.open('./selfbot.sqlite').then(() => sql.get('SELECT * FROM shortcuts WHERE name = ?', [message.content.slice(1)])).then(row => {
			if (!row) return;
			message.edit(row.contents).catch(error => console.log(error.stack));
		}).catch(error => winston.log('error', error.stack));
	}

	let cmdTxt = message.content.split(' ')[0].replace(cmdhandler.settings.prefix, '').toLowerCase(),
		args = message.content.replace(/ {2,}/g, ' ').split(' ').slice(1);

	let cmd;
	if (cmdhandler.commands.hasOwnProperty(cmdTxt)) {
		cmd = cmdhandler.commands[cmdTxt];
	} else if (cmdhandler.aliases.hasOwnProperty(cmdTxt)) {
		cmd = cmdhandler.commands[cmdhandler.aliases[cmdTxt]];
	}

	if (cmd) {
		if (cmd.hasOwnProperty('permissions')) {
			let missingPerms = [];
			cmd.permissions.forEach(val => {
				if (!message.channel.permissionsFor(client.user).hasPermission(val)) {
					missingPerms.push(cmdhandler.toTitleCase(val.replace('_', ' ')));
				}
			});
			if (missingPerms.length > 0) {
				message.edit(`That command cannot be run without the following Missing Permissions: **${missingPerms}**`).catch(error => console.log(error.stack));
				return;
			}
		}
		try {
			cmd.execute(client, message, args);
		} catch (e) {
			log(e);
			message.edit(`command ${cmdTxt} failed :(\n ${e.stack}`).catch(error => console.log(error.stack));
		}
	}

});

client.on('reconnecting', () => {
	let date = new Date().toLocaleDateString();
	let time = new Date().toLocaleTimeString();
	log(`Reconnected at ${date} @ ${time}`);
	winston.info(`Reconnected at ${date} @ ${time}`);
});

client.on('disconnect', () => {
	let date = new Date().toLocaleDateString();
	let time = new Date().toLocaleTimeString();
	console.log(`Disconnected on the ${date}, at ${time}, attempting to reconnect`);
	winston.info(`Disconnected on the ${date}, at ${time}, attempting to reconnect`);
});

let reload = (message) => {
	delete require.cache[require.resolve('./bot_self_commands.js')];
	try {
		cmdhandler = require('./bot_self_commands.js');
	} catch (err) {
		message.channel.sendMessage(`Problem loading bot_self_commands.js: ${err}`).then(
			response => response.delete(1000).catch(error => winston.log('error', error.stack))
		).catch(error => winston.log('error', error.stack));
		log(`Problem loading bot_self_commands.js: ${err}`);
	}
	message.channel.sendMessage('Commands reload was a success!').then(
		response => response.delete(1000).catch(error => winston.log('error', error.stack))
	).catch(error => winston.log('error', error.stack));
	log('Commands reload was a success!');
};



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

client.login(cmdhandler.settings.token).catch(error => console.log(error.stack));

exports.reload = reload;
exports.time = time;
exports.date = date;
exports.log = log;
exports.MemoryUsing = MemoryUsing;
exports.token = token;
process.on('unhandledRejection', err => {
	console.error('Uncaught Promise Error: \n' + err.stack);
});
