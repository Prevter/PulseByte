const Command = require("../../types/command");

module.exports = class extends Command {
    constructor(client, database) {
        super(client, database, {
            name: 'seek',
            aliases: ['rewind'],
            category: 'music',
            guild_only: true,
            args: [{
                name: 'time',
                type: 'string',
                required: true
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

        if (!args.time)
            return await interaction.reply({ embeds: [Command.createErrorEmbed(locale('seek.no_time'))] });

        const time = args.time.split(':');
        if (time.length > 3)
            return await interaction.reply({ embeds: [Command.createErrorEmbed(locale('seek.invalid_time'))] });

        const seconds = time.reduce((acc, cur, i) => acc + cur * Math.pow(60, time.length - i - 1), 0);
        if (isNaN(seconds))
            return await interaction.reply({ embeds: [Command.createErrorEmbed(locale('seek.invalid_time'))] });

        try {
            await queue.seek(seconds);
            await interaction.reply({ embeds: [Command.createEmbed({ description: locale('seek.success', args.time) })] });
        }
        catch (err) {
            await interaction.reply({ embeds: [Command.createErrorEmbed(locale('seek.error', args.time))] });
        }
    }

    async run(message, locale, args) {
        const voiceChannel = message.member?.voice?.channel;
        if (!voiceChannel)
            return await message.reply({ embeds: [Command.createErrorEmbed(locale('music.no_voice'))] });

        const queue = this.discord.distube.getQueue(message);
        if (!queue)
            return await message.reply({ embeds: [Command.createErrorEmbed(locale('music.no_queue'))] });

        if (!args[0])
            return await message.reply({ embeds: [Command.createErrorEmbed(locale('seek.no_time'))] });

        const time = args[0].split(':');
        if (time.length > 3)
            return await message.reply({ embeds: [Command.createErrorEmbed(locale('seek.invalid_time'))] });

        const seconds = time.reduce((acc, cur, i) => acc + cur * Math.pow(60, time.length - i - 1), 0);
        if (isNaN(seconds))
            return await message.reply({ embeds: [Command.createErrorEmbed(locale('seek.invalid_time'))] });

        try {
            await queue.seek(seconds);
            await message.react('✅');
        }
        catch (err) {
            await message.react('❌');
        }
    }
}