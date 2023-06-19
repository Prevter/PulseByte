const Command = require("../../types/command");

module.exports = class extends Command {
    constructor(client, database) {
        super(client, database, {
            name: 'playskip',
            aliases: ['ps', 'skipplay'],
            category: 'music',
            guild_only: true,
            args: [{
                name: 'query',
                type: 'string',
                required: true
            }]
        });
    }

    async runAsSlash(interaction, locale, args) {
        if (!args.query)
            return await interaction.reply({ embeds: [Command.createErrorEmbed(locale('play.no_query'))] });

        const voiceChannel = interaction.member?.voice?.channel;
        if (!voiceChannel)
            return await interaction.reply({ embeds: [Command.createErrorEmbed(locale('music.no_voice'))] });

        const options = {
            textChannel: interaction.channel,
            member: interaction.member,
            interaction,
            skip: true
        };

        try {
            await this.discord.distube.play(voiceChannel, args.query, options);

            const songs = await this.discord.distube.getQueue(interaction)?.songs;
            if (!songs) throw new Error(locale('play.not_found'));

            await interaction.reply({ embeds: [Command.createEmbed({ description: locale('play.success') })] });
        }
        catch (e) {
            this.client.logger.error('playskip', e);
            await interaction.reply({ embeds: [Command.createErrorEmbed(locale('play.error', err.message))] });
        }

    }

    async run(message, locale, args) {
        if (args.length < 1)
            return await message.reply({ embeds: [Command.createErrorEmbed(locale('play.no_query'))] });

        const voiceChannel = message.member?.voice?.channel;
        if (!voiceChannel)
            return await message.reply({ embeds: [Command.createErrorEmbed(locale('music.no_voice'))] });

        const options = {
            textChannel: message.channel,
            member: message.member,
            message,
            skip: true
        };

        try {
            await this.discord.distube.play(voiceChannel, args.join(' '), options);

            const songs = await this.discord.distube.getQueue(message)?.songs;
            if (!songs) throw new Error(locale('play.not_found'));

            await message.react('✅');
        }
        catch (e) {
            await message.reply({ embeds: [Command.createErrorEmbed(locale('play.error', e.message))] });
        }
    }
}