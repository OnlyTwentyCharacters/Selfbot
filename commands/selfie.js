const fse = require('fs-promise');
const exec = require('child_process').exec;
exports.run = function(client, message, args) {
	message.delete();
	exec('fswebcam --fps 15 -S 8 -r 400x225 --no-banner selfie.jpg', (error) => {
		// callback runs when the command is done!
		if (error) return console.log(error);
		const image = fse.readFileSync('selfie.jpg');
		client.channels.get(message.channel.id).sendFile(image, 'selfie.jpg', args.join(' '));
	});
};
