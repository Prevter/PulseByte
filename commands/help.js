const { prefix } = require("../config.json");
const { EmbedBuilder } = require('discord.js');

let commands = new Array();

const translations = {
	en: {
		desc: "List all available commands",
		args: {
			command: "Command name to get more information"
		},
		embedTitle: "All available commands",
		embedDesc: "For detailed information about command, add it's name as an argument",
		embedFooter: "Current prefix: '{0}'",
		notFound: "'{0}' not found!",
		infoAbout: "Information about '{0}'",
		aliases: "Aliases:",
		types: {
			string: "String",
			number: "Number",
			bool: "Boolean",
			user: "User",
			channel: "Channel"
		},
	},
	uk: {
		desc: "Вивести список усіх доступних команд",
		args: {
			command: "Назва команди щоб отримати більше інформації"
		},
		embedTitle: "Усі доступні команди",
		embedDesc: "Для детальної інформації про команду, додайте її назву у якості аргументу",
		embedFooter: "Поточний префікс: '{0}'",
		notFound: "'{0}' не знайдено!",
		infoAbout: "Інформація про '{0}'",
		aliases: "Псевдоніми:",
		types: {
			string: "Строка",
			number: "Число",
			bool: "Булеве значення",
			user: "Користувач",
			channel: "Канал"
		},
	},
};

module.exports = {
	name: "help",
	aliases: ["h", "хелп", "помоги", "хелпани", "допоможи"],
	arguments: [
		{
			name: "command",
			type: "string"
		}
	],
	translations: translations,
	run: async (args, db, locale, callback) => {
		if(!translations.hasOwnProperty(locale)) 
			locale = "en";
		
		let footer = translations[locale].embedFooter;
		footer = footer.replace("{0}", prefix);
		
		let embed = new EmbedBuilder()
			.setColor(0x0099FF);
		
		if (args.command) {
			// check if this command exists
			let command = null;
			commands.every(cmd => {
				if (cmd.name === args.command) {
					command = cmd;
					return false;
				}
				for (var i = 0; i < cmd.aliases.length; i++) {
					if (cmd.aliases[i] === args.command) {
						command = cmd;
						return false;
					}
				}
				return true;
			});
			
			if (!command) {
				callback({ 
					type: "text", 
					content: translations[locale].notFound.replace("{0}", args.command)
				});
				return;
			}
			
			embed.setTitle(translations[locale].infoAbout.replace("{0}", command.name));
			embed.setDescription(command.translations[locale].desc);
			
			const aliasesStr = command.aliases.join(", ");
			embed.addFields({
				name: translations[locale].aliases,
				value: aliasesStr
			});
			
			for (const arg of command.arguments) {
				embed.addFields({
					name: `${arg.name}${arg.isRequired ? '*' : ''} (${translations[locale].types[arg.type]})`,
					value: command.translations[locale].args[arg.name],
					inline: true
				});
			}
		}
		else {
			embed.setTitle(translations[locale].embedTitle)
				.setDescription(translations[locale].embedDesc)
				.setFooter({ text: footer });
				
			for (const cmd of commands) {
				embed.addFields({
					name: cmd.name,
					value: cmd.translations[locale].desc,
					inline: true
				});
			}
		}
		
		callback({
			type: "embed",
			content: embed
		});
	}
}

const commandsPath = require("path").join(__dirname, "");
require("fs").readdirSync(commandsPath).forEach(function(file) {
	commands.push(require("./" + file));
});