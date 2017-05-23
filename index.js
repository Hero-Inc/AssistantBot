const Discord = require('discord.js');
const GoogleAssistant = require('google-assistant');
const ffmpeg = require('fluent-ffmpeg');

var bot = new Discord.Client();
var assistant = new GoogleAssistant();

bot.on('msg', (msg) => {
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
	}
	if (!msg.content.startsWith('!')) return;
});

assistant.on('ready', () => {
	bot.login('AUTHKEY');
});
