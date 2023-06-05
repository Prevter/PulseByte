const Command = require("../../types/command");

module.exports = class extends Command {
    constructor(client, database) {
        super(client, database, {
            name: 'imgur',
            aliases: [],
            category: 'search',
            args: [{
                name: 'query',
                type: 'string',
                required: true
            }]
        });
    }

    async getData(query) {
        const url = `https://api.imgur.com/3/gallery/search/time/0/?q=${encodeURIComponent(query)}`;
        const response = await Command.fetch(url, {
            headers: {
                "Authorization": `Client-ID ${this.config.imgur_client_id}`
            }
        });

        if (response.data.length > 0) {
            const result = response.data[0];
            return result.link;
        }

        return null;
    }

    async run(message, locale, args) {
        if (args.length === 0) {
            await message.reply({ embeds: [Command.createErrorEmbed(locale('global.no_query'))] });
            return;
        }

        const query = args.join(' ');
        const image = await this.getData(query);
        if (!image)
            return await message.reply({ embeds: [Command.createErrorEmbed(locale('global.not_found'))] });
        await message.reply(image);
    }

    async runAsSlash(interaction, locale, args) {
        if (!args.query) {
            interaction.reply({ embeds: [Command.createErrorEmbed(locale('global.no_query'))] });
            return;
        }

        await interaction.deferReply();
        const query = args.query;
        const image = await this.getData(query);
        if (!image)
            return await interaction.editReply({ embeds: [Command.createErrorEmbed(locale('global.not_found'))] });
        await interaction.editReply(image);
    }
}