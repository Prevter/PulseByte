const Command = require("../../types/command");
const localeBuilder = require('../../locale');
const fs = require('fs');

module.exports = class extends Command {
    constructor(client, database) {
        const _langs = [];
        fs.readdirSync('./src/locales/', { withFileTypes: true }).forEach(file => {
            _langs.push(file.name.split('.')[0]);
        });

        const langs = _langs.map(value => {
            const locale = localeBuilder(value);
            return {
                name: locale(`language.name`),
                value
            }
        });

        super(client, database, {
            name: 'language',
            aliases: ['lang'],
            args: [{
                name: 'language',
                type: 'choice',
                choices: langs
            }],
            category: 'admin',
            admin_only: true,
            guild_only: true
        });
    }

    async runAsSlash(interaction, locale, args) {
        let arg = [];
        if (args.language) {
            arg.push(args.language);
        }
        await this.run(interaction, locale, arg);
    }

    async run(message, locale, args) {
        let langs = {};
        this._locales.forEach(l => {
            const loc = localeBuilder(l);
            langs[l] = loc;
        });

        const showAllLangs = async () => {
            let fields = [];
            for (const [key, value] of Object.entries(langs)) {
                fields.push({
                    name: value(`language.name`),
                    value: key
                });
            }

            const embed = Command.createEmbed({
                title: locale('language.supported'),
                fields
            });

            await message.reply({ embeds: [embed] });
        };

        if (args.length === 0) {
            return await showAllLangs();
        }

        const language = args[0];
        if (!this._locales.includes(language)) {
            return await showAllLangs();
        }

        message.guild_data.language = language;
        await this.database.updateGuild(message.guild_data);
        await message.reply({ embeds: [Command.createEmbed({ description: langs[language]('language.updated') })] });
    }
}