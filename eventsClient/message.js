// const sql = require('sqlite');
module.exports = message => {
	console.log('I am firing');
	// // const client = message.client;
	// if (!message.content.startsWith('!!')) return;
	// if (message.content.split(' ').length === 1) {
	// 	sql.open('../selfbot.sqlite').catch(error=>console.log(error));
	// 	sql.get('SELECT * FROM shortcuts WHERE name = ?', [message.content.slice(1)]).then(row => {
	// 		if (!row) return;
	// 		message.edit(row.contents);
	// 	}).catch(error => console.log(error));
	// }

};
