const Discord = require('discord.js');
const GoogleAssistant = require('google-assistant');
const Snowboy = require('snowboy');
// const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');


var detector = new Snowboy.Detector();
var models = new Snowboy.Models();

models.add({
	file: '',
	sensitivity: 0.5,
	hotwords: '',
});

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

detector
	.on('silence', () => {
		console.log('silence');
	})
	.on('sound', buffer => {
		console.log('sound');
	})
	.on('hotword', (index, hotword, buffer) => {
		console.log('hotword', index, hotword);
	})
	.on('error', () => {
		console.log('error');
	});

bot
	.on('msg', (msg) => {
		if (msg.author.bot) return;
		if (msg.channel.type !== 'text') return msg.reply('Sorry, I only work in text channels').then(m => { m.delete(10000); });
		// Join a voiceChannel
		if (msg.content.toLowerCase() === 'gjoin' && msg.member.voiceChannel !== undefined) {
			msg.member.voiceChannel.join()
			.then(connection => {
				msg.reply(`OK, Joining ${msg.member.voiceChannel}`)
					.then(m => {
						m.delete(10000);
					});
			}, e => {
				msg.reply(`Error joining your channel: ${e}`)
					.then(m => {
						m.delete(10000);
					});
			});
			msg.delete(10000);
		} else if (msg.content.toLowerCase() === 'ghelp') {
			msg.reply("I'm your personal assistant, use 'gjoin' to make me join your channel");
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
