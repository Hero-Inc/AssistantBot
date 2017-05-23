const Discord = require('discord.js');
const GoogleAssistant = require('google-assistant');
const ffmpeg = require('fluent-ffmpeg');

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
		if (msg.content.toLowerCase() === 'join' && msg.channel.type === 'text' && msg.member.voiceChannel !== undefined) {
			msg.member.voiceChannel.join()
			.then(connection => {
				let reciever = connection.createReciever();
				let stream = ffmpeg()
				.input(reciever.createOpusStream(msg.author))
				.audioBitrate(24000)
				.audioChannels(1)
				.audioCodec('FLAC')
				.pipe();
				connection.playStream(stream)
				.on('end', reason => {
					connection.disconnect();
				});
			});
			msg.delete(10000);
		}
		if (!msg.content.startsWith('!')) return;
	});

assistant
	.on('ready', () => {
		bot.login('AUTHKEY');
	})
	.on('started', conversation => {

	})
	.on('error', e => {
		throw e;
	});
