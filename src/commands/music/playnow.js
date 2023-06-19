const Command = require("../../types/command");

module.exports = class extends Command {
    constructor(client, database) {
        super(client, database, {
            name: 'playnow',
            aliases: ['pn'],
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
            position: 1
        };

        try {
            await this.discord.distube.play(voiceChannel, args.query, options);

            const songs = await this.discord.distube.getQueue(interaction).songs;
            const track = songs[songs.length - 1];
            const isCurrent = songs.length === 1;

            if (!args.query.startsWith('http') && !isCurrent) {
                const name = track.name ?? 'Unknown';
                const author = track.uploader.name ?? 'Unknown';
                const duration = track.formattedDuration ?? 'Unknown';
                const thumbnail = track.thumbnail ?? '';
                await interaction.reply({
                    embeds: [Command.createEmbed({
                        description: locale('play.added', name, author, duration),
                        thumbnail: thumbnail
                    })]
                });
            }
            else {
                await interaction.reply({ embeds: [Command.createEmbed({ description: locale('play.success') })] });
            }
        }
        catch (e) {
            this.client.logger.error('playnow', e);
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
            position: 1
        };

        try {
            await this.discord.distube.play(voiceChannel, args.join(' '), options);

            const songs = await this.discord.distube.getQueue(message)?.songs;
            if (!songs) throw new Error(locale('play.not_found'));

            const track = songs[songs.length - 1];
            const isCurrent = songs.length === 1;

            if (!args[0].startsWith('http') && !isCurrent) {
                const name = track.name ?? 'Unknown';
                const author = track.uploader.name ?? 'Unknown';
                const duration = track.formattedDuration ?? 'Unknown';
                const thumbnail = track.thumbnail ?? '';
                await message.reply({
                    embeds: [Command.createEmbed({
                        description: locale('play.added', name, author, duration),
                        thumbnail: thumbnail
                    })]
                });
            }
            else {
                await message.react('✅');
            }
        }
        catch (e) {
            await message.reply({ embeds: [Command.createErrorEmbed(locale('play.error', e.message))] });
        }
    }
}