const Discord = require('discord.js'),
	bot = new Discord.Client({
		fetch_all_members: true
	});
const settings = require('./settings.json');
//const datastore = require('./fileloader.js');
//const touch = require('touch');
//const fse = require('fs-extra');
const moment = require('moment');
const sql = require('sqlite');
const winston = require('winston');
winston.add(winston.transports.File, {
	filename: 'logs/selfbot.log'
});
winston.remove(winston.transports.Console);

var log = (msg) => {
	bot.channels.get(settings.channelid).sendMessage(msg);
};
var prefix = settings.prefix;
var trollmode = false;
var hours = new Date().getHours();
var minutes = new Date().getMinutes();

let unit = ['', 'K', 'M', 'G', 'T', 'P'];

function bytesToSize(input, precision) {
	let index = Math.floor(Math.log(input) / Math.log(1024));
	if (unit >= unit.length) return input + ' B';
	return (input / Math.pow(1024, index)).toFixed(precision) + ' ' + unit[index] + 'B';
}

let MemoryUsing = bytesToSize(process.memoryUsage().rss, 3);
var date = new Date().toLocaleDateString();
var time = new Date().toLocaleTimeString();
exports.time = time;
exports.date = date;
exports.settings = settings;
exports.moment = moment;
exports.log = log;
exports.hours = hours;
exports.minutes = minutes;
exports.MemoryUsing = MemoryUsing;

bot.on('ready', () => {
	let bootup = [
		'```xl',
		'BOOT TIME STATISTICS',
		`• Booted   : ${date} @ ${time}`,
		`• Users	: ${bot.users.size}`,
		`• Servers  : ${bot.guilds.size}`,
		`• Channels : ${bot.channels.size}`,
		'```'
	];
	log(bootup.join('\n'));
	winston.log('info', `Launched at ${hours}:${minutes}, to ${bot.users.size} users, across ${bot.guilds.size} guilds, with ${bot.channels.size} channels.`);
	bot.user;
});
let cmdhandler = require('./cmdhandler.js');

bot.on('message', msg => {


	if (msg.content.startsWith('```js') && msg.content.endsWith('```')) {
		var zerospace = msg.content.split(' ').slice(0).join(' \u200B');
		var zerowidthcode = [
			`${zerospace}`
		];
		if (trollmode === true) {
			msg.edit(zerowidthcode.join('\n'));
		} else {
			return;
		}
	} else

	if (msg.author !== bot.user) return;
	if (!msg.content.startsWith(prefix)) return;

	if (msg.content.split(' ').length === 1) {
		sql.open('./selfbot.sqlite').then(() => sql.get('SELECT * FROM shortcuts WHERE name = ?', [msg.content.slice(1)])).then(row => {
			if (!row) return;
			msg.edit(row.contents);
		}).catch(console.error);
	} else

	if (msg.content.startsWith(prefix + 'trollmode')) {
		if (trollmode === true) {
			trollmode = false;
			msg.edit('Trollmode disabled.').then(response => setTimeout(() => response.delete(), 500));
		} else {
			trollmode = true;
			msg.edit('Trollmode enabled.').then(response => setTimeout(() => response.delete(), 500));
		}
	}


	let cmdTxt = msg.content.split(' ')[0].replace(prefix, '').toLowerCase(),
		args = msg.content.replace(/ {2,}/g, ' ').split(' ').slice(1);

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
				if (!msg.channel.permissionsFor(bot.user).hasPermission(val)) {
					missingPerms.push(cmdhandler.toTitleCase(val.replace('_', ' ')));
				}
			});
			if (missingPerms.length > 0) {
				msg.channel.sendMessage('That command cannot be run without the following Missing Permissions: **' + missingPerms.join(', ') + '**');
				return;
			}
		}
		try {
			cmd.execute(bot, msg, args);
		} catch (e) {
			log(e);
			msg.channel.sendMessage('command ' + cmdTxt + ' failed :(\n' + e.stack);
		}
	}

});

// Catch discord.js errors
bot.on('error', e => {
	winston.error(e);
});
bot.on('warn', e => {
	winston.warn(e);
});
bot.on('debug', e => {
	winston.info(e);
});

let reload = (msg) => {
	delete require.cache[require.resolve('./cmdhandler.js')];
	try {
		cmdhandler = require('./cmdhandler.js');
	} catch (err) {
		msg.edit(`Problem loading cmdhandler.js: ${err}`).then(
			response => setTimeout(() => response.delete(), 500)
		);
		log(`Problem loading cmdhandler.js: ${err}`);
	}
	msg.edit('Module Reload Success!').then(
		response => setTimeout(() => response.delete(), 500)
	);
	log('Module Reload Success!');
};


bot.login(settings.token);

exports.reload = reload;
