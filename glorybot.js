
var Discord = require('discord.js');
var client = new Discord.Client();
var fs = require('fs');

var glories = {

};

if (fs.existsSync('./glories.json')) {
	glories = JSON.parse(fs.readFileSync('./glories.json'));
}




client.on('message', function(msg) {
	if (msg.content.indexOf('!') === 0) {
		var pieces = msg.content.split(' ');
		var channel = msg.channel.guild.id;
		if (glories[channel] === undefined) {
			glories[channel] = {};
		}
		switch (pieces[0]) {
			case '!add':
				if (Number.isInteger(parseInt(pieces[1]))) {
					pieces[2] = pieces[1];
					pieces[1] = msg.guild.member(msg.author).nickname || msg.author.username;
				}
				pieces[1] = pieces[1].toLowerCase();
				if (glories[channel][pieces[1]] === undefined) {
					glories[channel][pieces[1]] = 0;
				}
				if (pieces[2]) {
					glories[channel][pieces[1]] += parseInt(pieces[2]);
				}
				fs.writeFileSync('./glories.json', JSON.stringify(glories));
				msg.reply(pieces[1] + "'s glory is now " + glories[channel][pieces[1]]);
				break;
			case '!list':
				var out = '\n'
				for (var knight in glories[channel]) {
					out += knight + ': ' + glories[channel][knight] + '\n';
				}
				msg.reply(out);
				break;
			case '!delete': 
				delete glories[channel][pieces[1]];
				fs.writeFileSync('./glories.json', JSON.stringify(glories));
				break;
			case '!clear':
				glories[channel] = {};
				fs.writeFileSync('./glories.json', JSON.stringify(glories));
				break;
			case '!set': 
				if (Number.isInteger(parseInt(pieces[1]))) {
					pieces[2] = pieces[1];
					pieces[1] = msg.guild.member(msg.author).nickname || msg.author.username;
				}
				pieces[1] = pieces[1].toLowerCase();
				glories[channel][pieces[1]] = parseInt(pieces[2]);
				fs.writeFileSync('./glories.json', JSON.stringify(glories));
				msg.reply(pieces[1] + "'s glory is now " + glories[channel][pieces[1]]);
				break;
		}
	}
});

client.login('MzQxNzA1ODkxMzYxMzI1MDc2.DGFGOA.dHInxjh3XXi7-4hJAFTOV8NfZE4');
