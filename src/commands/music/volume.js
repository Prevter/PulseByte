const Command = require("../../types/command");

const maxVolume = 500;

module.exports = class extends Command {
    constructor(client, database) {
        super(client, database, {
            name: 'volume',
            aliases: ['vol', 'v'],
            category: 'music',
            guild_only: true,
            args: [{
                name: 'volume',
                type: 'integer'
            }]
        });
    }

    async runAsSlash(interaction, locale, args) {
        const voiceChannel = interaction.member?.voice?.channel;
        if (!voiceChannel)
            return await interaction.reply({ embeds: [Command.createErrorEmbed(locale('music.no_voice'))] });

        const queue = this.discord.distube.getQueue(interaction);
        if (!queue)
            return await interaction.reply({ embeds: [Command.createErrorEmbed(locale('music.no_queue'))] });

        if (!args.volume)
            return await interaction.reply({
                embeds: [Command.createEmbed({
                    description: locale('volume.current_volume', queue.volume)
                })]
            });

        if (isNaN(args.volume) || args.volume < 0 || args.volume > maxVolume)
            return await interaction.reply({ embeds: [Command.createErrorEmbed(locale('volume.invalid_volume', maxVolume))] });

        await queue.setVolume(args.volume);
        await interaction.reply({ embeds: [Command.createEmbed({ description: locale('volume.success', args.volume) })] })
    }

    async run(message, locale, args) {
        const voiceChannel = message.member?.voice?.channel;
        if (!voiceChannel)
            return await message.reply({ embeds: [Command.createErrorEmbed(locale('music.no_voice'))] });

        const queue = this.discord.distube.getQueue(message);
        if (!queue)
            return await message.reply({ embeds: [Command.createErrorEmbed(locale('music.no_queue'))] });

        if (!args[0])
            return await message.reply({
                embeds: [Command.createEmbed({
                    description: locale('volume.current_volume', queue.volume)
                })]
            });

        const volume = parseInt(args[0]);
        if (isNaN(volume) || volume < 0 || volume > maxVolume)
            return await message.reply({ embeds: [Command.createErrorEmbed(locale('volume.invalid_volume', maxVolume))] });

        await queue.setVolume(volume);
        await message.react('✅');
    }
}