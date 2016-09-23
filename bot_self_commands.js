const bot = require('./bot_self.js');
const insult = require('./bot_self_insults.js');
const util = require('util');
const fse = require('fs-promise');
const sql = require('sqlite');
const moment = require('moment');
const Pad = (str, l) => {
	return str + Array(l - str.length + 1).join(' ');
};

var settings = require('./settings.json');
var pack = require('./package.json');

function GetUptime() {
	let sec_num = parseInt(process.uptime(), 10);
	let days = Math.floor(sec_num / 86400);
	sec_num %= 86400;
	let hours = Math.floor(sec_num / 3600);
	let minutes = Math.floor((sec_num - (hours * 3600)) / 60);
	let seconds = sec_num - (hours * 3600) - (minutes * 60);
	if (days < 10) days = '0' + days;
	if (hours < 10) hours = '0' + hours;
	if (minutes < 10) minutes = '0' + minutes;
	if (seconds < 10) seconds = '0' + seconds;
	let time = '';
	if (days != '00') time += `${days} ${days == '01' ? 'day' : 'days'} `;
	if (days != '00' || hours != '00') time += `${hours} ${hours == '01' ? 'hour' : 'hours'} `;
	if (days != '00' || hours != '00' || minutes != '00') time += `${minutes} ${minutes == '01' ? 'minute' : 'minutes'} `;
	if (days != '00' || hours != '00' || minutes != '00' || seconds != '00') time += `${seconds} ${seconds == '01' ? 'second' : 'seconds'} `;
	return time;
}

const aliases = {
	'p': 'ping',
	'r': 'reload',
	'h': 'help',
	't': 'tag',
	'tl': 'taglist',
	'at': 'addtag',
	'dt': 'deltag',
	'as': 'addslash',
	'ds': 'delslash',
	'sl': 'slashes',
	'ev': 'eval',
	'rld': 'reload',
	'brb': 'afk',
	'tags': 'taglist',
	'away': 'afk',
	'gone': 'sleep'
};

var commands = {

	ping: {
		name: 'ping',
		description: 'This is a standard response command.',
		usage: '',
		execute: function (client, message) {
			bot.updateMessage(message, `Pong! \`${new Date().getTime() - message.timestamp}\` ms`).catch(error => bot.winston.log('error', error.stack));
		}
	},

	help: {
		name: 'help',
		description: 'This will bring up information about the commands you want help with.',
		usage: 'help <command>',
		execute: function (client, message, args) {
			let sendhelp = [];
			let command = args[0];
			if (command) {
				if (commands.hasOwnProperty(command)) {
					sendhelp.push('\`\`\`xl');
					sendhelp.push('Description:');
					sendhelp.push(`'${commands[command].description}'`);
					if (commands[command].permissions) {
						sendhelp.push('Permissions:');
						sendhelp.push(`'${commands[command].permissions}'`);
					}
					if (commands[command].usage.length > 0) {
						sendhelp.push('Usage:');
						sendhelp.push(`'${commands[command].usage}'`);
					}
					sendhelp.push('Aliases:');
					for (var key in aliases) {
						if (aliases[key] === commands[command].name) {
							sendhelp.push(key);
						}
					}
					sendhelp.push('\`\`\`');
					bot.updateMessage(message, sendhelp).catch(error => bot.winston.log('error', error.stack));
				}
			} else {
				let toSend = '';
				let i = 0;
				let sortedKeys = Object.keys(commands);
				sortedKeys.sort();
				for (let key in sortedKeys) {
					if ((i % 3) == 0) {
						toSend += `\n${Pad(toTitleCase(sortedKeys[key]), 12)}`;
					} else {
						toSend += `${Pad(toTitleCase(sortedKeys[key]), 12)}`;
					}
					i++;
				}
				bot.updateMessage(message, `\`\`\`xl\nThis is a list of commands available to you, to get more info just do ${settings.prefix}help <command>\n ${toSend} \n\`\`\``)
					.catch(error => bot.winston.log('error', error.stack));
			}
		}
	},

	pin: {
		name: 'pin',
		description: 'This emulates the pin message functionality native to discord.',
		usage: 'pin <message ID>, <last> or <mention last>',
		execute: function (bot, msg, args) {
			const notes = settings.pinchannel;

			if (isNaN(args[0]) && args[0] === ('last')) {
				msg.channel.fetchMessages({
					limit: 1,
					before: msg.id
				}).then(messages => {
					let msg_array = messages.array();
					let lastresult = `:pushpin: **${msg_array[0].author.username}** wrote;

		${msg_array[0].content}

		${msg_array[0].guild.name} - ${msg_array[0].channel.name}; ${moment(msg_array[0].timestamp).format('D[/]M[/]Y [@] HH:mm:ss')}`;
					bot.channels.get(notes).sendMessage(lastresult).then(() =>
						msg.edit('Pin added successfully').then(m => m.delete(1000))
					).catch(() => {
						msg.edit('Could not find message!').then(m => m.delete(1000));
					});
				});
			} else

			if (msg.mentions.users && args[1] === ('last')) {
				msg.channel.fetchMessages({
					limit: 100
				}).then(messages => {
					let msg_array = messages.array();
					msg_array = msg_array.filter(m => m.author.id === msg.mentions.users.array()[0].id);
					let lastresult = `:pushpin: **${msg_array[0].author.username}** wrote;

		${msg_array[0].content}

		${msg_array[0].guild.name} - ${msg_array[0].channel.name}; ${moment(msg_array[0].timestamp).format('D[/]M[/]Y [@] HH:mm:ss')}`;
					bot.channels.get(notes).sendMessage(lastresult).then(() =>
						msg.edit('Pin added successfully').then(m => m.delete(1000))
					).catch(() => {
						msg.edit('Could not find message!').then(m => m.delete(1000));
					});
				});
			} else {
				let pinmessage = msg.channel.messages.get(args[0]);
				let result = `:pushpin: **${pinmessage.author.username}** wrote;

		${pinmessage.content}

		${pinmessage.guild.name} - ${pinmessage.channel.name}; ${moment(pinmessage.timestamp).format('D[/]M[/]Y [@] HH:mm:ss')}`;
				bot.channels.get(notes).sendMessage(result).then(() =>
					msg.edit('Pin added successfully').then(m => m.delete(1000))
				).catch(() => {
					msg.edit('Could not find message!').then(m => m.delete(1000));
				});
			}
		}
	},

	afk: {
		name: 'afk',
		description: 'Appends [is AFK] to the nickname',
		usage: '',
		permissions: ['CHANGE_NICKNAME'],
		execute: function (client, message) {
			let nickname = message.guild.member(client.user).nickname;
			let username = message.guild.member(client.user).user.username;
			if (!nickname) {
				message.guild.member(client.user).setNickname(username + ' [is AFK]').then(() => {
					bot.updateMessage(message, 'Set to away from keyboard').then(response => response.delete(1000));
				}).catch(error => bot.winston.log('error', error.stack));
			} else

			if (nickname.search(' [is AFK]')) {
				message.guild.member(client.user).setNickname('').then(() => {
					bot.updateMessage(message, 'No longer AFK').then(response => response.delete(1000));
				}).catch(error => bot.winston.log('error', error.stack));
			} else

			if (nickname && !nickname.includes(' [is AFK]')) {
				message.guild.member(client.user).setNickname(nickname + ' [is AFK]').then(() => {
					bot.updateMessage(message, 'Set to Away From Keyboard').then(response => response.delete(1000));
				}).catch(error => bot.winston.log('error', error.stack));
			} else if (nickname.search(' [is AFK]')) {
				message.guild.member(client.user).setNickname(nickname.replace(/ \[AFK\]/g, '')).then(() => {
					bot.updateMessage(message, 'No longer AFK').then(response => response.delete(1000));
				}).catch(error => bot.winston.log('error', error.stack));
			}
		}
	},

	sleep: {
		name: 'sleep',
		description: 'Appends [is sleeping] to the nickname',
		usage: '',
		permissions: ['CHANGE_NICKNAME'],
		execute: function (client, message) {
			let nickname = message.guild.member(client.user).nickname;
			let username = message.guild.member(client.user).user.username;
			if (!nickname) {
				message.guild.member(client.user).setNickname(username + ' [is sleeping]').then(() => {
					bot.updateMessage(message, 'Set to sleeping').then(response => response.delete(1000));
				}).catch(error => bot.winston.log('error', error.stack));
			} else

			if (nickname.search(' [is sleeping]')) {
				message.guild.member(client.user).setNickname('').then(() => {
					bot.updateMessage(message, 'No longer sleeping').then(response => response.delete(1000));
				}).catch(error => bot.winston.log('error', error.stack));
			} else

			if (nickname && !nickname.includes(' [is sleeping]')) {
				message.guild.member(client.user).setNickname(nickname + ' [is sleeping]').then(() => {
					bot.updateMessage(message, 'Set to sleeping').then(response => response.delete(1000));
				}).catch(error => bot.winston.log('error', error.stack));
			} else if (nickname.search(' [is sleeping]')) {
				message.guild.member(client.user).setNickname(nickname.replace(/ \[SLEEPING\]/g, '')).then(() => {
					bot.updateMessage(message, 'No longer sleeping').then(response => response.delete(1000));
				}).catch(error => bot.winston.log('error', error.stack));
			}
		}
	},

	info: {
		name: 'info',
		description: 'Displays information such as memory usage, how long it has been running for, size of guilds/members/channels and when it launched.',
		usage: '',
		execute: function (client, message) {
			let uptime = GetUptime();
			let djsv = pack.dependencies['discord.js'].split('^')[1];
			let mome = pack.dependencies['moment'].split('^')[1];
			let wins = pack.dependencies['winston'].split('^')[1];
			let sqli = pack.dependencies['sqlite'].split('^')[1];
			let botv = pack.version;
			let auth = pack.author;
			let infomsg = [
				'\`\`\`xl',
				'STATISTICS',
				`• Mem Usage	: ${bot.MemoryUsing}`,
				`• Uptime	   : ${uptime}`,
				`• Started	  : ${bot.date} @ ${bot.time}`,
				`• Users		: ${client.users.size}`,
				`• Servers	  : ${client.guilds.size}`,
				`• Channels	 : ${client.channels.size}`,
				`• Discord.JS   : ${djsv}`,
				`• Bot Author   : ${auth}`,
				`• Bot Version  : ${botv}`,
				`• Dependencies : Winston ${wins}, Moment ${mome}, SQLite ${sqli}`,
				'\`\`\`'
			];
			bot.updateMessage(message, infomsg).catch(error => bot.winston.log('error', error.stack));
		}
	},

	insult: {
		name: 'insult',
		description: 'One of the worlds best features, a truly random insult generator.',
		usage: 'insult <mention>',
		execute: function (client, message) {
			if (!message.mentions.users.array()[0]) {
				bot.updateMessage(message, 'You need to @mention someone to insult them... idiot')
					.then(response => response.delete(1000))
					.catch(error => bot.winston.log('error', error.stack));
			} else {
				bot.updateMessage(message, message.mentions.users.first() + ', You know what? You\'re nothing but ' +
					insult.start[
						Math.floor(Math.random() * insult.start.length)
					] + ' ' +
					insult.middle[
						Math.floor(Math.random() * insult.middle.length)
					] + ' ' +
					insult.end[
						Math.floor(Math.random() * insult.end.length)
					] + '.').catch(error => bot.winston.log('error', error.stack));
			}
		}
	},

	reload: {
		name: 'Reload',
		description: 'This reloads all of the commands without having to reboot the bot.',
		usage: '',
		execute: function (client, message) {
			bot.reload(message);
		}
	},

	setgame: {
		name: 'setgame',
		description: 'Sets the bots game',
		usage: 'setgame <game>',
		execute: function (client, message, args) {
			client.user.setStatus(null, args.join(' ')).then(() => {
				let text = args.join(' ') ? 'Game changed to ' + args.join(' ') : 'Game Cleared';
				bot.updateMessage(message, text).then(response => response.delete(1000));
			}).catch(error => bot.winston.log('error', error.stack));
		}
	},

	setnick: {
		name: 'setnick',
		description: 'Applies or clears a nickname',
		usage: 'setnick <nickname>',
		permissions: ['CHANGE_NICKNAME'],
		execute: function (client, message, args) {
			message.guild.member(client.user).setNickname(args.join(' ')).then(() => {
				let text = args.join(' ') ? 'Nickname changed to ' + args.join(' ') : 'Nickname Cleared';
				bot.updateMessage(message, text).then(response => response.delete(1000));
			}).catch(error => bot.winston.log('error', error.stack));

		}
	},

	setprefix: {
		name: 'setprefix',
		description: 'Changes the command prefix',
		usage: 'setprefix <new prefix>',
		execute: function (client, message, args) {
			//set prefix
			var settingsfile = JSON.parse(fse.readFileSync('settings.json'));
			settingsfile.prefix = args[0];
			//save changes to json
			fse.writeFileSync('settings.json', JSON.stringify(settingsfile, null, '\t'));
			//reload the command file
			bot.reload(message);
			//give feedback
			bot.updateMessage(message, 'Prefix set to: ' + settingsfile.prefix)
				.then(response => response.delete(1000))
				.catch(error => bot.winston.log('error', error.stack));
		}
	},

	shame: {
		name: 'shame',
		description: 'Based on the Shame bell from Game Of Thrones, this command will tag a user and shame them with bells',
		usage: 'shame <mention>',
		execute: function (client, message) {
			if (!message.mentions.users) {
				bot.updateMessage(message, 'You\'ve gotta mention someone to shame them!')
					.then(response => response.delete(1000))
					.catch(error => bot.winston.log('error', error.stack));
			} else {
				bot.updateMessage(message, 'SHAME :bell: ' + message.mentions.users.first() + ' :bell: SHAME')
					.catch(error => bot.winston.log('error', error.stack));
			}
		}
	},

	prune: {
		name: 'prune',
		description: 'This will clear the quantity of messages that you specified',
		usage: 'prune <quantity>',
		execute: function (client, message, args) {
			let messagecount = parseInt(args) ? parseInt(args[0]) : 1;
			message.channel.fetchMessages({
				limit: 100
			})
				.then(messages => {
					let msg_array = messages.array();
					msg_array = msg_array.filter(m => m.author.id === client.user.id);
					msg_array.length = messagecount + 1;
					msg_array.map(m => m.delete()
						.catch(error => bot.winston.log('error', error.stack)));
				});
		}
	},

	purge: {
		name: 'purge',
		description: 'This is the bigger and meaner sibling of prune, this will delete any messages within the quantity you specified.',
		usage: 'purge <quantity>',
		permissions: ['MANAGE_MESSAGES', 'READ_MESSAGE_HISTORY'],
		execute: function (client, message, args) {
			let messagecount = parseInt(args);
			message.channel.fetchMessages({
				limit: messagecount
			})
				.then(messages => {
					messages.map(m => m.delete()
						.catch(error => bot.winston.log('error', error.stack)));
				});
		}
	},

	eval: {
		name: 'eval',
		description: 'Evaluate and execute JavaScript code and expressions, very powerful be careful when using this',
		usage: '',
		execute: function (client, message) {
			let suffix = message.content.slice(6);

			try {
				let evaled = eval(suffix);
				let type = typeof evaled;
				let insp = util.inspect(evaled, {
					depth: 0
				});
				let tosend = [];

				if (evaled === null) evaled = 'null';

				tosend.push('**EVAL:**');
				tosend.push('\`\`\`xl');
				tosend.push(clean(suffix));
				tosend.push('\`\`\`');
				tosend.push('**Evaluates to:**');
				tosend.push('\`\`\`xl');
				tosend.push(clean(evaled.toString().replace(bot.token, '[Redacted]')));
				tosend.push('\`\`\`');
				if (evaled instanceof Object) {
					tosend.push('**Inspect:**');
					tosend.push('\`\`\`xl');
					tosend.push(insp.toString().replace(bot.token, '[Redacted]'));
					tosend.push('\`\`\`');
				} else {
					tosend.push('**Type:**');
					tosend.push('\`\`\`xl');
					tosend.push(type);
					tosend.push('\`\`\`');
				}
				bot.updateMessage(message, tosend)
					.catch(error => bot.winston.log('error', error.stack));
				bot.sendMessage(client.channels.get(settings.evachannel), tosend)
					.catch(error => bot.winston.log('error', error.stack));
			} catch (err) {
				let tosend = [];
				tosend.push('**EVAL:** \`\`\`xl');
				tosend.push(clean(suffix));
				tosend.push('\`\`\`');
				tosend.push('**Error:** \`\`\`xl');
				tosend.push(clean(err.stack));
				tosend.push('\`\`\`');
				bot.updateMessage(message, tosend)
					.catch(error => bot.winston.log('info', error.stack));
				bot.sendMessage(client.channels.get(settings.errchannel), tosend)
					.catch(error => bot.winston.log('error', error.stack));
			}
		}
	},

	reboot: {
		name: 'reboot',
		description: 'This will make your bot exit cleanly, and if you are using PM2, Forver or a similar module, it will restart it.',
		usage: '',
		execute: function (client, message) {
			bot.updateMessage(message, 'Rebooting...').then(() => {
				process.exit();
			});
		}
	},

	addtag: {
		name: 'addtag',
		description: 'This will add a tag (Kinda like a custom emote) to the database, and it supports multiple lines as well!',
		usage: 'addtag <name> <contents>',
		execute: function (bot, msg, args) {
			let name = args[0];
			let contents = args.slice(1).join(' ');
			sql.open('./selfbot.sqlite').then(() => sql.get(`SELECT * FROM tags WHERE name = '${name}'`)).then(row => {
				if (!row) {
					sql.run('INSERT INTO tags (name, contents) VALUES (?, ?)', [name, contents]).then(() => {
						msg.edit('Tag (' + name + ') was added').then(response => {
							response.delete(5000);
						});
					}).catch(error => bot.winston.log('error', error.stack));
				} else {
					msg.edit('Duplicate Tag (' + name + ') found.').then(response => {
						response.delete(5000);
					}).catch(error => bot.winston.log('error', error.stack));
				}
			}).catch(error => bot.winston.log('error', error.stack));
		}
	},

	tag: {
		name: 'tag',
		description: 'This is how you use the tags you create.',
		usage: 'tag <tag name>',
		execute: function (bot, msg, args) {
			sql.open('./selfbot.sqlite').then(() => sql.get('SELECT * FROM tags WHERE name = ?', args[0])).then(row => {
				if (row) {
					let message_content = msg.mentions.users.array().length === 1 ? `${msg.mentions.users.array()[0]} ${row.contents}` : row.contents;
					msg.edit(message_content);
				} else {
					msg.edit(`Could not find tag (${args[0]}).`).then(response => {
						response.delete(5000);
					});
				}
			}).catch(error => bot.winston.log('error', error.stack));
		}
	},

	deltag: {
		name: 'deltag',
		description: 'If you want to remove a tag this is the command for you!',
		usage: 'deltag <tag name>',
		execute: function (bot, msg, args) {
			sql.open('./selfbot.sqlite').then(() => {
				sql.run('DELETE FROM tags WHERE name = ?', args[0])
					.then(() => {
						msg.edit('The tag (' + args[0] + ') has been deleted').then(response => {
							response.delete(5000);
						});
					})
					.catch(error => bot.winston.log('error', error.stack));
			});
		}
	},

	taglist: {
		name: 'taglist',
		description: 'Use this if you want to display all the tags you have stored.',
		usage: 'taglist',
		execute: function (bot, msg) {
			sql.open('./selfbot.sqlite').then(() => sql.all('SELECT * FROM tags')).then(rows => {

				msg.edit('Tags: ' + rows.map(r => r.name).join(', ')).then(response =>
					response.delete(5000)
				);
			}).catch(error => bot.winston.log('error', error.stack));
		}
	},

	addslash: {
		name: 'addslash',
		description: 'This will add a new "slash" command, like /shrug on the discord PC client, it supports multiple lines as well!',
		usage: 'addslash <name> <contents>',
		execute: function (bot, msg, args) {
			var name = args[0];
			var contents = args.slice(1).join(' ');
			sql.open('./selfbot.sqlite').then(() => sql.get(`SELECT * FROM shortcuts WHERE name = '${name}'`)).then(
				row => {
					if (!row) {
						sql.run('INSERT INTO shortcuts (name, contents) VALUES (?, ?)', [name, contents]).then(() => {
							msg.edit('Slash (' + name + ') was added').then(response => {
								response.delete(5000);
							});
						}).catch(error => bot.winston.log('error', error.stack));
					} else {
						msg.edit('Duplicate slash (' + name + ') found.').then(response => {
							response.delete(5000);
						}).catch(error => bot.winston.log('error', error.stack));
					}
				});
		}
	},

	delslash: {
		name: 'delslash',
		description: 'If you want to delete a tag, this is the command you would need',
		usage: 'delslash <name>',
		execute: function (bot, msg, args) {
			sql.open('./selfbot.sqlite').then(() => {
				sql.run('DELETE FROM shortcuts WHERE name = ?', args[0])
					.then(() => {
						msg.edit('The shortcut (' + args[0] + ') has been deleted').then(response => {
							response.delete(5000);
						});
					})
					.catch(error => bot.winston.log('error', error.stack));
			});
		}
	},

	slashes: {
		name: 'slashes',
		description: 'Displays all slash commands',
		usage: '',
		execute: function (bot, msg) {
			sql.open('./selfbot.sqlite').then(() => sql.all('SELECT * FROM shortcuts')).then(rows => {
				let message = [];
				message.push('\`\`\`xl');
				var longest = rows.reduce(function (a, b) {
					return a.name.length > b.name.length ? a : b;
				});
				rows.map(row => {
					let padded = (row.name + ' '.repeat(longest.name.length + 1 - row.name.length));
					message.push(`${settings.prefix}${padded}: ${row.contents}`);
				});
				message.push('\`\`\`');
				msg.edit(message).then(response =>
					response.delete(5000)
				);
			}).catch(error => bot.winston.log('error', error.stack));
		}
	}

};

function clean(text) {
	if (typeof (text) === 'string') {
		return text.replace(/`/g, '`' + String.fromCharCode(8203)).replace(/@/g, '@' + String.fromCharCode(8203));
	} else {
		return text;
	}
}

const toTitleCase = (str) => {
	return str.replace(/\w\S*/g, function (txt) {
		return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
	});
};

exports.toTitleCase = toTitleCase;
exports.aliases = aliases;
exports.commands = commands;
exports.settings = settings;
