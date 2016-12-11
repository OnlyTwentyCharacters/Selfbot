exports.run = function(client, message, args) {
	var meme = args.join(' ');
	var Canvas = require('canvas'), Image = Canvas.Image, canvas = new Canvas(416, 350), ctx = canvas.getContext('2d');

	ctx.fillStyle = 'black';
	ctx.fillRect(0, 0, 416,350);
	ctx.fill();
	ctx.font = '30px Impact';
	ctx.fillStyle = 'white';
	ctx.fillText(meme.toUpperCase(), 208, 28, 416);

	var te = ctx.measureText(meme.toUpperCase());
	ctx.strokeStyle = 'rgba(0,0,0,0.5)';
	ctx.beginPath();
	ctx.lineTo(208, 30);
	ctx.lineTo(208 + te.width / 2, 30);
	ctx.stroke();
	message.channel.sendFile(canvas.toBuffer());
};
