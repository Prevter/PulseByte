const { prefixes } = require("../config.json");
const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const { Translator } = require('../common/utils');

let commands = new Array();

const translations = {
	en: {
		desc: "List all available commands",
		args: {
			command: "Command name, page number or category"
		},
		embedTitle: "All available commands",
		embedDesc: "For detailed information about command, add it's name as an argument. Use help <page> to see more commands",
		embedFooter: "Prefixes: {0}",
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
		categories: {
			utils: "Utils",
			mod: "Moderation",
			fun: "Fun",
			music: "Music",
			general: "General",
			experience: "Experience",
		}
	},
	uk: {
		desc: "Вивести список усіх доступних команд",
		args: {
			command: "Назва команди, номер сторінки або категорія"
		},
		embedTitle: "Усі доступні команди",
		embedDesc: "Для детальної інформації про команду, додайте її назву у якості аргументу. Використовуйте help <сторінка> щоб побачити більше команд",
		embedFooter: "Префікси: {0}",
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
		categories: {
			utils: "Утиліти",
			mod: "Модерація",
			fun: "Розваги",
			music: "Музика",
			general: "Загальне",
			experience: "Досвід",
		}
	},
};

module.exports = {
	name: "help",
	category: "general",
	aliases: ["h", "хелп", "помоги", "хелпани", "допоможи"],
	arguments: [
		{
			name: "command",
			type: "string"
		}
	],
	translations: translations,
	run: async (args, db, locale, callback, meta) => {
		let translate = new Translator(translations, locale);

		let footer = translate('embedFooter');
		let prefixesStr = "";
		for (const prefix of prefixes) {
			prefixesStr += `'${prefix}', `;
		}
		prefixesStr = prefixesStr.substring(0, prefixesStr.length - 2);

		footer = footer.replace("{0}", prefixesStr);

		let embed = new EmbedBuilder()
			.setColor(0x0099FF);

		const showHelpPage = (page) => {
			embed.setTitle(translate('embedTitle'))
				.setDescription(translate('embedDesc'))
				.setFooter({ text: footer });

			const onePage = 9;

			let start = (page - 1) * onePage;
			let end = start + onePage;
			if (end > commands.length) end = commands.length;

			// check if there are any commands
			if (start >= commands.length) {
				// make it page 1
				start = 0;
				end = onePage;
				if (end > commands.length) end = commands.length;
			}

			for (let i = start; i < end; i++) {
				let cmd = commands[i];
				// check if user has permissions to use this command
				if (cmd.permissions && meta.member) {
					let hasPermissions = true;
					for (const perm of cmd.permissions) {
						if (!meta.member.permissions.has(PermissionsBitField.Flags[perm])) {
							hasPermissions = false;
							break;
						}
					}
					if (!hasPermissions) continue;
				}

				// check if guild only
				if (cmd.guildOnly && !meta.guild) continue;

				embed.addFields({
					name: cmd.name,
					value: cmd.translations[locale].desc,
					inline: true
				});
			}
		}

		if (args.command) {
			// if it's a number, then it's a page number
			if (!isNaN(args.command)) {
				let page = parseInt(args.command);
				if (page < 1) {
					callback({
						type: "text",
						content: translate('notFound', args.command)
					});
					return;
				}
				showHelpPage(page);
			}
			else {
				// check if it's a category name
				let category = null;
				for (const trans of Object.values(translations)) {
					for (const [key, name] of Object.entries(trans.categories)) {
						if (name.toLowerCase() === args.command.toLowerCase()) {
							category = key;
							break;
						}
						if (key === args.command.toLowerCase()) {
							category = key;
							break;
						}
					}
				}

				if (category) {
					// show all commands from this category
					embed.setTitle(translate('embedTitle'))
						.setDescription(translate('embedDesc'))
						.setFooter({ text: footer });
					
					for (const cmd of commands) {
						if (cmd.category === category) {
							// check if user has permissions to use this command
							if (cmd.permissions && meta.member) {
								let hasPermissions = true;
								for (const perm of cmd.permissions) {
									if (!meta.member.permissions.has(PermissionsBitField.Flags[perm])) {
										hasPermissions = false;
										break;
									}
								}
								if (!hasPermissions) continue;
							}

							// check if guild only
							if (cmd.guildOnly && !meta.guild) continue;

							embed.addFields({
								name: cmd.name,
								value: cmd.translations[locale].desc,
								inline: true
							});
						}
					}
				}
				else {
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
							content: translate('notFound', args.command)
						});
						return;
					}

					embed.setTitle(translate('infoAbout', command.name));
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
			}
		}
		else {
			showHelpPage(1);
		}

		callback({
			type: "embed",
			content: embed
		});
	}
}

const commandsPath = require("path").join(__dirname, "");
require("fs").readdirSync(commandsPath).forEach(function (file) {
	commands.push(require("./" + file));
});