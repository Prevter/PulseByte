const Command = require("../../types/command");

const filterModes = {
    '3d': '3D',
    'bassboost': 'Bassboost',
    'echo': 'Echo',
    'karaoke': 'Karaoke',
    'nightcore': 'Nightcore',
    'vaporwave': 'Vaporwave',
    'flanger': 'Flanger',
    'gate': 'Gate',
    'haas': 'Haas',
    'reverse': 'Reverse',
    'surround': 'Surround',
    'mcompand': 'Mcompand',
    'phaser': 'Phaser',
    'tremolo': 'Tremolo',
    'earwax': 'Earwax'
};


module.exports = class extends Command {
    constructor(client, database) {
        super(client, database, {
            name: 'filter',
            aliases: ['effect', 'effects', 'fx'],
            category: 'music',
            guild_only: true,
            args: [{
                name: 'filter',
                type: 'choice',
                choices: [
                    ...Object.keys(filterModes).map(key => ({
                        name: filterModes[key],
                        value: key
                    })),
                    {
                        name: 'Disable all filters',
                        value: 'off'
                    }
                ],
            }]
        });
    }

    parseFilter(filter) {
        const filterKey = Object.keys(filterModes)
            .find(key => key.startsWith(filter.toLowerCase()));
        if (filterKey === undefined) return null;
        return filterKey;
    }

    async runAsSlash(interaction, locale, args) {
        await this.run(interaction, locale, [args.filter]);
    }

    async run(message, locale, args) {
        const voiceChannel = message.member?.voice?.channel;
        if (!voiceChannel)
            return await message.reply({ embeds: [Command.createErrorEmbed(locale('music.no_voice'))] });

        const queue = this.discord.distube.getQueue(message);
        if (!queue)
            return await message.reply({ embeds: [Command.createErrorEmbed(locale('music.no_queue'))] });

        if (!args[0]) {
            const filters = queue.filters;
            const embed = Command.createEmbed({
                title: locale('filter.title'),
                fields: [
                    ...Object.keys(filterModes).map(key => ({
                        name: `${filters.has(key) ? '🟢' : '🔴'} ${filterModes[key]}`,
                        value: locale(`filter.${key}`),
                        inline: true
                    }))
                ]
            });
            return await message.reply({ embeds: [embed] });
        }

        if (args[0] === 'off') {
            const filters = Object.keys(filterModes);
            queue.filters.remove(filters);
            return await message.reply({
                embeds: [Command.createEmbed({
                    description: locale('filter.success.off')
                })]
            })
        }

        const filter = this.parseFilter(args[0]);
        if (filter === null)
            return await message.reply({ embeds: [Command.createErrorEmbed(locale('filter.invalid_filter'))] });

        if (queue.filters.has(filter)) {
            queue.filters.remove(filter);
        }
        else {
            queue.filters.add(filter);
        }

        await message.reply({
            embeds: [Command.createEmbed({
                description: locale(
                    `filter.success.${queue.filters.has(filter) ? 'enable' : 'disable'}`,
                    filterModes[filter]
                )
            })]
        })
    }
}