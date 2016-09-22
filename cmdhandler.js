const client = require('./selfbot.js');
const insult = require('./insult-generator.js');
//const touch = require('touch');
const fse = require('fs-extra');
const moment = require('moment');
const sql = require('sqlite');
const winston = require('winston');
const util = require('util');
const Pad = (str, l) => {
	return str + Array(l - str.length + 1).join(' ');
};

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
	'rld': 'reload',
	'brb': 'afk',
	'away': 'afk',
	'gone': 'sleep'
};

const commands = {

	ping: {
		name: 'ping',
		description: 'This is a standard response command.',
		usage: '',
		execute: function (bot, msg) {
			msg.edit(`Pong! \`${new Date().getTime() - msg.timestamp}\` ms`);
		}
	},

	help: {
		name: 'help',
		description: 'This will bring up information about the commands you want help with.',
		usage: 'help <command>',
		execute: function (bot, msg, args) {
			let sendhalp = [];
			let command = args[0];
			if (command) {
				if (commands.hasOwnProperty(command)) {
					sendhalp.push('\`\`\`xl');
					sendhalp.push('Description:');
					sendhalp.push(`'${commands[command].description}'`);
					if (commands[command].permissions) {
						sendhalp.push('Permissions:');
						sendhalp.push(`'${commands[command].permissions}'`);
					}
					if (commands[command].usage.length > 0) {
						sendhalp.push('Usage:');
						sendhalp.push(`'${commands[command].usage}'`);
					}
					sendhalp.push('\`\`\`');
					msg.edit(sendhalp.join('\n'));
				}
			} else { //typical help command
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
				msg.edit(`\`\`\`xl\nThis is a list of commands available to you, to get more info just do ${client.settings.prefix}help <command>\n ${toSend} \n\`\`\``);
			}
		}
	},

	afk: {
		name: 'afk',
		description: 'Appends [is AFK] to the nickname',
		usage: '',
		permissions: ['CHANGE_NICKNAME'],
		execute: function (bot, msg) {
			let nickname = msg.guild.member(bot.user).nickname;
			let username = msg.guild.member(bot.user).user.username;
			if (!nickname) {
				msg.guild.member(bot.user).setNickname(username + ' [is AFK]').then(() => {
					msg.edit('Set to away from keyboard').then(response => response.delete(1000));
				}).catch(error => msg.channel.get(client.settings.channelid).sendMessage(error.message));
			} else

			if (nickname.search(' [is AFK]')) {
				msg.guild.member(bot.user).setNickname('').then(() => {
					msg.edit('No longer AFK').then(response => response.delete(1000));
				}).catch(error => msg.channel.get(client.settings.channelid).sendMessage(error.message));
			} else

			if (nickname && !nickname.includes(' [is AFK]')) {
				msg.guild.member(bot.user).setNickname(nickname + ' [is AFK]').then(() => {
					msg.edit('Set to Away From Keyboard').then(response => response.delete(1000));
				}).catch(error => msg.channel.get(client.settings.channelid).sendMessage(error.message));
			} else if (nickname.search(' [is AFK]')) {
				msg.guild.member(bot.user).setNickname(nickname.replace(/ \[AFK\]/g, '')).then(() => {
					msg.edit('No longer AFK').then(response => response.delete(1000));
				}).catch(error => msg.channel.get(client.settings.channelid).sendMessage(error.message));
			}
		}
	},

	sleep: {
		name: 'sleep',
		description: 'Appends [is sleeping] to the nickname',
		usage: '',
		permissions: ['CHANGE_NICKNAME'],
		execute: function (bot, msg) {
			let nickname = msg.guild.member(bot.user).nickname;
			let username = msg.guild.member(bot.user).user.username;
			if (!nickname) {
				msg.guild.member(bot.user).setNickname(username + ' [is sleeping]').then(() => {
					msg.edit('Set to sleeping').then(response => response.delete(1000));
				}).catch(error => msg.channel.get(client.settings.channelid).sendMessage(error.message));
			} else

			if (nickname.search(' [is sleeping]')) {
				msg.guild.member(bot.user).setNickname('').then(() => {
					msg.edit('No longer sleeping').then(response => response.delete(1000));
				}).catch(error => msg.channel.get(client.settings.channelid).sendMessage(error.message));
			} else

			if (nickname && !nickname.includes(' [is sleeping]')) {
				msg.guild.member(bot.user).setNickname(nickname + ' [is sleeping]').then(() => {
					msg.edit('Set to sleeping').then(response => response.delete(1000));
				}).catch(error => msg.channel.get(client.settings.channelid).sendMessage(error.message));
			} else if (nickname.search(' [is sleeping]')) {
				msg.guild.member(bot.user).setNickname(nickname.replace(/ \[SLEEPING\]/g, '')).then(() => {
					msg.edit('No longer sleeping').then(response => response.delete(1000));
				}).catch(error => msg.channel.get(client.settings.channelid).sendMessage(error.message));
			}
		}
	},

	info: {
		name: 'info',
		description: 'Displays information such as memory usage, how long it has been running for, size of guilds/members/channels and when it launched.',
		usage: '',
		execute: function (bot, msg) {
			let uptime = GetUptime();
			let djsv = pack.dependencies['discord.js'].split('^')[1];
			let mome = pack.dependencies['moment'].split('^')[1];
			let wins = pack.dependencies['winston'].split('^')[1];
			let sqli = pack.dependencies['sqlite'].split('^')[1];
			let botv = pack.version;
			let auth = pack.author;
			let message = [
				'\`\`\`xl',
				'STATISTICS',
				`• Mem Usage	: ${client.MemoryUsing}`,
				`• Uptime	   : ${uptime}`,
				`• Started	  : ${client.date} @ ${client.time}`,
				`• Users		: ${bot.users.size}`,
				`• Servers	  : ${bot.guilds.size}`,
				`• Channels	 : ${bot.channels.size}`,
				`• Discord.JS   : ${djsv}`,
				`• Bot Author   : ${auth}`,
				`• Bot Version  : ${botv}`,
				`• Dependencies : Winston ${wins}, Moment ${mome}, SQLite ${sqli}`,
				'\`\`\`'
			];
			msg.edit(message.join('\n'));
		}
	},

	refresh: {
		name: 'refresh',
		description: 'Refreshes the package.json file.',
		usage: '',
		execute: function (bot, msg) {
			delete require.cache[require.resolve('./package.json')];
			try {
				pack = require('./package.json');
			} catch (err) {
				msg.edit(`Problem loading package.json: ${err}`).then(
					response => response.delete(1000)
				);
			}
			msg.edit('Package reload was a success!').then(
				response => response.delete(1000)
			);
		}
	},

	reload: {
		name: 'Reload',
		description: 'This reloads all of the commands without having to reboot the bot itself.',
		usage: '',
		execute: function (bot, msg) {
			client.reload(msg);
		}
	},

	setgame: {
		name: 'setgame',
		description: 'Sets the clients game',
		usage: 'setgame <game>',
		execute: function (bot, msg, args) {
			bot.user.setStatus(null, args.join(' ')).then(() => {
				let text = args.join(' ') ? 'Game changed to ' + args.join(' ') : 'Game Cleared';
				msg.edit(text).then(response => response.delete(1000));
			}).catch(error => msg.edit(error.message).then(response => response.delete(1000)));
		}
	},

	setnick: {
		name: 'setnick',
		description: 'Applies or clears a nickname',
		usage: 'setnick <nickname>',
		permissions: ['CHANGE_NICKNAME'],
		execute: function (bot, msg, args) {
			msg.guild.member(bot.user).setNickname(args.join(' ')).then(() => {
				let text = args.join(' ') ? 'Nickname changed to ' + args.join(' ') : 'Nickname Cleared';
				msg.edit(text).then(response => response.delete(1000));
			}).catch(error => msg.edit(error.message).then(response => response.delete(1000)));

		}
	},

	setprefix: {
		name: 'setprefix',
		description: 'Changes the command prefix',
		usage: 'setprefix <new prefix>',
		execute: function (bot, msg, args) {
			//set prefix
			var settings = JSON.parse(fse.readFileSync('settings.json'));
			settings.prefix = args[0];
			//save changes to json
			fse.writeFileSync('settings.json', JSON.stringify(settings, null, '\t'));
			//reload the command file
			client.reload(msg);
			client.refreshsettings(msg);
			//give feedback
			msg.edit('Prefix set to: ' + settings.prefix).then(response => response.delete(1000));
		}
	},

	pin: {
		name: 'pin',
		description: 'This emulates the pin message functionality native to discord.',
		usage: 'pin <message ID>, <last> or <mention last>',
		execute: function (bot, msg, args) {
			const notes = client.settings.pinchannel;

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

	shame: {
		name: 'shame',
		description: 'Based on the Shame bell from Game Of Thrones, this command will tag a user and shame them with bells',
		usage: 'shame <mention>',
		execute: function (bot, msg) {
			if (!msg.mentions.users) {
				msg.edit('You\'ve gotta mention someone to shame them!').then(response => {
					setTimeout(() => response.delete(), 1000);
				});
			} else {
				msg.edit('SHAME :bell: ' + msg.mentions.users.array()[0] + ' :bell: SHAME');
			}
		}
	},

	insult: {
		name: 'insult',
		description: 'One of the worlds best features, a truly random insult generator.',
		usage: 'insult <mention>',
		execute: function (bot, msg) {
			if (!msg.mentions.users.array()[0]) {
				msg.edit('You need to @mention someone to insult them... idiot').then(response => {
					setTimeout(() => response.delete(), 1000);
				});
			} else {
				msg.edit(msg.mentions.users.array()[0] + ', You know what? You\'re nothing but ' +
					insult.start[
						Math.floor(Math.random() * insult.start.length)
					] + ' ' +
					insult.middle[
						Math.floor(Math.random() * insult.middle.length)
					] + ' ' +
					insult.end[
						Math.floor(Math.random() * insult.end.length)
					] + '.');
			}
		}
	},

	prune: {
		name: 'prune',
		description: 'This will clear the quantity of messages that you specified',
		usage: 'prune <quantity>',
		execute: function (bot, msg, args) {
			let messagecount = parseInt(args) ? parseInt(args[0]) : 1;
			msg.channel.fetchMessages({
				limit: 100
			})
				.then(messages => {
					let msg_array = messages.array();
					msg_array = msg_array.filter(m => m.author.id === bot.user.id);
					msg_array.length = messagecount + 1;
					msg_array.map(m => m.delete().catch(console.error));
				});
		}
	},

	purge: {
		name: 'purge',
		description: 'This is the bigger and meaner sibling of prune, this will delete any messages within the quantity you specified.',
		usage: 'purge <quantity>',
		permissions: ['MANAGE_MESSAGES', 'READ_MESSAGE_HISTORY'],
		execute: function (bot, msg, args) {
			let messagecount = parseInt(args);
			msg.channel.fetchMessages({
				limit: messagecount
			})
				.then(messages => {
					messages.map(m => m.delete().catch(console.error));
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
							response.delete(1000);
						});
					}).catch(console.log);
				} else {
					msg.edit('Duplicate Tag (' + name + ') found.').then(response => {
						response.delete(1000);
					}).catch(console.log);
				}
			}).catch(console.log);
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
						response.delete(1000);
					});
				}
			}).catch(console.error);
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
							response.delete(1000);
						});
					})
					.catch(console.log());
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
			}).catch(console.error);
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
								response.delete(1000);
							});
						}).catch(console.log());
					} else {
						msg.edit('Duplicate slash (' + name + ') found.').then(response => {
							response.delete(1000);
						}).catch(console.log());
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
							response.delete(1000);
						});
					})
					.catch(console.log());
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
					message.push(`${client.settings.prefix}${padded}: ${row.contents}`);
				});
				message.push('\`\`\`');
				msg.edit(message).then(response =>
					response.delete(2000)
				);
			}).catch(console.error);
		}
	},

	eval: {
		name: 'eval',
		description: 'Evaluate and execute JavaScript code and expressions, very powerful be careful when using this',
		usage: '',
		execute: function (bot, msg) {
			let suffix = msg.content.slice(6);

			try {
				let evaled = eval(suffix);
				let type = typeof evaled;
				let insp = util.inspect(evaled, {
					depth: 0
				});
				let tosend = [];

				if (evaled === null) evaled = 'null';

				if (evaled.toString().includes(bot.token) ||
					insp.toString().includes(bot.token)) return msg.edit('Cannot complete eval due to token.');

				tosend.push('**EVAL:**');
				tosend.push('\`\`\`xl');
				tosend.push(clean(suffix));
				tosend.push('\`\`\`');
				tosend.push('**Evaluates to:**');
				tosend.push('\`\`\`xl');
				tosend.push(clean(evaled));
				tosend.push('\`\`\`');
				if (evaled instanceof Object) {
					tosend.push('**Inspect:**');
					tosend.push('\`\`\`xl');
					tosend.push(insp);
					tosend.push('\`\`\`');
				} else {
					tosend.push('**Type:**');
					tosend.push('\`\`\`xl');
					tosend.push(type);
					tosend.push('\`\`\`');
				}
				msg.edit(tosend.join('\n'));
				winston.log('info', `Evaluated ${tosend.join('\n')}`);
			} catch (err) {
				let tosend = [];
				tosend.push('**EVAL:** \`\`\`xl');
				tosend.push(clean(suffix));
				tosend.push('\`\`\`');
				tosend.push('**Error:** \`\`\`xl');
				tosend.push(clean(err.stack));
				tosend.push('\`\`\`');
				msg.edit(tosend.join('\n'));
				winston.log('info', `Error: ${tosend.join('\n')}`);
			}
		}
	},

	reboot: {
		name: 'reboot',
		description: 'This will make your bot exit cleanly, and if you are using PM2, Forver or a similar module, it will restart it.',
		usage: '',
		execute: function (bot, msg) {
			msg.edit('Rebooting...').then(() => {
				winston.log('info', 'Reboot started.');
				process.exit();
			});
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
