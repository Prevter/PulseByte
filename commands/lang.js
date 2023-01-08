const { EmbedBuilder } = require('discord.js');

const translations = {
	en: {
		desc: "Change bot's language on current server",
		args: {
			language: "Two-letter language code (eg. 'en', 'uk')"
		},
		lang: "English",
		embedTitle: "Supported languages",
		selected: "Language changed to English",
	},
	uk: {
		desc: "Змінити мову бота на поточному сервері",
		args: {
			language: "Двохбуквений код мови (напр. 'en', 'uk')"
		},
		lang: "Українська (Ukrainian)",
		embedTitle: "Підтримані мови",
		selected: "Мову змінено на Українську"
	},
};

module.exports = {
	name: "lang",
	aliases: ["language", "ланг", "мова", "язык"],
	arguments: [
		{
			name: "language",
			type: "string",
			isRequired: true
		}
	],
	permissions: [ 'ManageGuild' ],
	guildOnly: true,
	translations: translations,
	run: (args, db, locale, callback, meta) => {
		if(!translations.hasOwnProperty(locale)) 
			locale = "en";
		
		let languages = [];
		for (const [lang, data] of Object.entries(translations)) {
			languages.push({ code: lang, name: data.lang });
		}
		
		let embed = new EmbedBuilder()
			.setColor(0x0099FF)
			.setTitle(translations[locale].embedTitle);
		
		for (const lang of languages) {
			embed.addFields({
				name: lang.code,
				value: lang.name,
				inline: true
			});
		}
		
		if (!args.language) {
			callback({ type: 'embed', content: embed });
			return;
		}
		
		var exists = false;
		for (const lang of languages) {
			if (lang.code === args.language) {
				exists = true
				break;
			}
		}
		
		if (!exists) {
			callback({ type: 'embed', content: embed });
			return;
		}
		
		var sql = `SELECT * FROM locales WHERE id = ?`;
		var row = db.prepare(sql).get(meta.guild.id);
		if (!row) {
			sql = `INSERT INTO locales (id, locale) VALUES (?, ?)`;
			db.prepare(sql).run(meta.guild.id, args.language);
		}
		else {
			sql = `UPDATE locales SET locale = ? WHERE id = ?`;
			db.prepare(sql).run(args.language, meta.guild.id);
		}
		callback({ type: 'text', content: translations[args.language].selected });
	}
}