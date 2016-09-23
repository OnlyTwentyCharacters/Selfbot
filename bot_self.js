const Discord = require('discord.js'),
	client = new Discord.Client({
		fetch_all_members: true
	});
const winston = require('winston');
const sql = require('sqlite');

winston.add(winston.transports.File, {
	filename: 'logs/selfbot.log'
});
winston.remove(winston.transports.Console);

var cmdhandler = require('./bot_self_commands.js');
var settings = cmdhandler.settings;
var date = new Date().toLocaleDateString();
var time = new Date().toLocaleTimeString();

function sendMessage(channel, content) {
	return channel.sendMessage(content);
}

function updateMessage(message, content) {
	return message.edit(content);
}

var log = (message) => {
	sendMessage(client.channels.get(settings.logchannel), message)
		.catch(error => console.log(error.stack));
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
	if (message.author !== client.user) return;
	if (!message.content.startsWith(settings.prefix)) return;

	if (message.content.split(' ').length === 1) {
		sql.open('./selfbot.sqlite').then(() => sql.get('SELECT * FROM shortcuts WHERE name = ?', [message.content.slice(1)])).then(row => {
			if (!row) return;
			updateMessage(message, row.contents);
		}).catch(error => winston.log('error', error.stack));
	}

	let cmdTxt = message.content.split(' ')[0].replace(settings.prefix, '').toLowerCase(),
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
				sendMessage(message.channel, `That command cannot be run without the following Missing Permissions: **${missingPerms}**`);
				return;
			}
		}
		try {
			cmd.execute(client, message, args);
		} catch (e) {
			log(e);
			sendMessage(message.channel, `command ${cmdTxt} failed :(\n ${e.stack}`);
		}
	}

});

let reload = (message) => {
	delete require.cache[require.resolve('./bot_self_commands.js')];
	try {
		cmdhandler = require('./bot_self_commands.js');
	} catch (err) {
		sendMessage(message.channel, `Problem loading bot_self_commands.js: ${err}`).then(
			response => response.delete(1000)
		);
		log(`Problem loading bot_self_commands.js: ${err}`);
	}
	sendMessage(message.channel, 'Commands reload was a success!').then(
		response => response.delete(1000)
	);
	log('Commands reload was a success!');
};

// Catch discord.js errors and remove client token,
// Uncomment one below, comment the other out.
// var token = /[\w\d]{24}\.[\w\d]{6}\.[\w\d-_]{27}/g; // !2FA tokens
var token = /((?:mfa.[\w-]+))/g; // 2FA Tokens
client.on('error', e => {
	winston.error(e.replace(token, '[Redacted]'));
});
client.on('warn', e => {
	winston.warn(e.replace(token, '[Redacted]'));
});
client.on('debug', e => {
	winston.info(e.replace(token, '[Redacted]'));
});

client.login(settings.token);

exports.reload = reload;
exports.time = time;
exports.date = date;
exports.log = log;
exports.MemoryUsing = MemoryUsing;
exports.token = token;
//exports.token = token;
exports.sendMessage = sendMessage;
exports.updateMessage = updateMessage;
