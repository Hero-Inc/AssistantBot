const Discord = require('discord.js');
const GoogleAssistant = require('google-assistant');
// const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');

var bot = new Discord.Client();
var assistant = new GoogleAssistant({
	auth: {
		keyFilePath: '',
		savedTokensPath: '',
	},
	audio: {
		encodingIn: 'FLAC',
		sampleRateOut: 24000,
	},
});

bot
	.on('msg', (msg) => {
		if (msg.author.bot) return;
		// Join a voiceChannel
		if (msg.content.toLowerCase() === 'gjoin' && msg.channel.type === 'text' && msg.member.voiceChannel !== undefined) {
			msg.member.voiceChannel.join()
			.then(connection => {
				msg.reply(`OK, Joining ${msg.member.voiceChannel}`);
			}, e => {
				msg.reply(`Error joining your channel: ${e}`);
			});
			msg.delete(10000);
		}
	});

assistant
	.on('ready', () => {
		bot.login('AUTHKEY');
	})
	.on('started', conversation => {
		let file = fs.createWriteStream('stuff');
		conversation
			.on('data', data => {
				file.write(data);
			});
	})
	.on('error', e => {
		throw e;
	});
