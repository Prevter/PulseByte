const Command = require("../../types/command");

module.exports = class extends Command {
    constructor(client, database) {
        super(client, database, {
            name: 'urban',
            aliases: [],
            category: 'search',
            args: [{
                name: 'query',
                type: 'string',
                required: true
            }]
        });
    }

    async getData(query, locale) {
        const url = `https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(query)}`;
        const response = await Command.fetch(url);

        if (response.list.length > 0) {
            const result = response.list[0];
            const data = {
                title: locale('urban.title', result.word),
                url: result.permalink,
                description: result.definition,
                thumbnail: 'https://images-ext-2.discordapp.net/external/HMmIAukJm0YaGc2BKYGx5MuDJw8LUbwqZM9BW9oey5I/https/i.imgur.com/VFXr0ID.jpg',
                fields: [
                    {
                        name: locale('urban.example'),
                        value: result.example
                    },
                    {
                        name: '👍',
                        value: `${result.thumbs_up}`,
                        inline: true
                    },
                    {
                        name: '👎',
                        value: `${result.thumbs_down}`,
                        inline: true
                    }
                ],
                footer: { text: locale('urban.author', result.author) }
            };
            return Command.createEmbed(data);
        }

        return Command.createErrorEmbed(locale('global.not_found'));
    }

    async run(message, locale, args) {
        if (args.length === 0) {
            await message.reply({ embeds: [Command.createErrorEmbed(locale('global.no_query'))] });
            return;
        }

        const query = args.join(' ');
        const result = await this.getData(query, locale);
        return await message.reply({ embeds: [result] });
    }

    async runAsSlash(interaction, locale, args) {
        if (!args.query) {
            interaction.reply({ embeds: [Command.createErrorEmbed(locale('global.no_query'))] });
            return;
        }

        await interaction.deferReply();
        const query = args.query;
        const result = await this.getData(query, locale);
        return await interaction.editReply({ embeds: [result] });
    }
}