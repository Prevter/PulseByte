const Command = require("../../types/command");

module.exports = class extends Command {
    constructor(client, database) {
        super(client, database, {
            name: 'manga',
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
        const url = `https://kitsu.io/api/edge/manga?filter[text]=${query}&page[limit]=1`;
        const response = await Command.fetch(url);
        const result = response.data[0];
        if (!result) return Command.createErrorEmbed(locale('global.not_found'));

        const genres_url = result.relationships.genres.links.related;
        const genres_response = await Command.fetch(genres_url);
        const genres = genres_response.data.map(value => value.attributes.name);

        const data = {
            title: result.attributes.canonicalTitle,
            url: `https://kitsu.io/manga/${result.id}`,
            description: result.attributes.synopsis,
            thumbnail: result.attributes.posterImage.medium,
            fields: [
                {
                    name: locale('anime.status'),
                    value: locale(`anime.statuses.${result.attributes.status}`),
                    inline: true
                },
                {
                    name: locale('anime.type'),
                    value: result.attributes.subtype,
                    inline: true
                },
                {
                    name: locale('anime.genres'),
                    value: genres.join(', ') || locale('global.none'),
                },
                {
                    name: locale('manga.published'),
                    value: locale('anime.aired_format', result.attributes.startDate, result.attributes.endDate)
                },
                {
                    name: locale('manga.chapters'),
                    value: `${result.attributes.chapterCount ?? '?'}`,
                    inline: true
                },
                {
                    name: locale('manga.volumes'),
                    value: `${result.attributes.volumeCount ?? '?'}`,
                    inline: true
                },
                {
                    name: locale('anime.average_rating'),
                    value: `${result.attributes.averageRating ?? '?'}/100`,
                    inline: true
                },
                {
                    name: locale('anime.age_rating'),
                    value: `${result.attributes.ageRating}${result.attributes.ageRatingGuide ? ` (${result.attributes.ageRatingGuide})` : ''}`,
                    inline: true
                },
                {
                    name: locale('anime.rank'),
                    value: `TOP ${result.attributes.ratingRank ? result.attributes.ratingRank.toLocaleString('en-US') : '?'}`,
                    inline: true
                },
            ]
        };

        return Command.createEmbed(data);
    }

    async run(message, locale, args) {
        if (args.length === 0) {
            await message.reply({ embeds: [Command.createErrorEmbed(locale('global.no_query'))] });
            return;
        }

        const query = args.join(' ');
        const data = await this.getData(query, locale);
        await message.reply({ embeds: [data] });
    }

    async runAsSlash(interaction, locale, args) {
        if (!args.query) {
            await interaction.reply({ embeds: [Command.createErrorEmbed(locale('global.no_query'))] });
            return;
        }

        await interaction.deferReply();
        const query = args.query;
        const data = await this.getData(query, locale);
        await interaction.editReply({ embeds: [data] });
    }
}