const Command = require("../../types/command");

module.exports = class extends Command {
    constructor(client, database) {
        super(client, database, {
            name: 'skip',
            aliases: ['s', 'next', 'n'],
            category: 'music',
            guild_only: true,
            args: [{
                name: 'count',
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

        try {
            let number = args.count;
            if (isNaN(number) || number < 1)
                number = 1;

            if (number > 1) {
                await queue.jump(number);
            } else {
                if (queue.songs.length > 1 || queue.autoplay)
                    await queue.skip();
                else {
                    await queue.stop();
                }
            }
            return await interaction.reply({ embeds: [Command.createEmbed({ description: locale('skip.success') })] })
        } catch (e) {
            this.logger.error('skip', 'Error skipping track:', e);
            return await interaction.reply({ embeds: [Command.createErrorEmbed(locale('skip.error'))] })
        }
    }

    async run(message, locale, args) {
        const voiceChannel = message.member?.voice?.channel;
        if (!voiceChannel)
            return await message.reply({ embeds: [Command.createErrorEmbed(locale('music.no_voice'))] });

        const queue = this.discord.distube.getQueue(message);
        if (!queue)
            return await message.reply({ embeds: [Command.createErrorEmbed(locale('music.no_queue'))] });

        try {
            let number = parseInt(args[0]);
            if (isNaN(number) || number < 1)
                number = 1;

            if (number > 1) {
                await queue.jump(number);
            } else {
                if (queue.songs.length > 1 || queue.autoplay)
                    await queue.skip();
                else {
                    await queue.stop();
                }
            }
            await message.react('✅');
        } catch (e) {
            this.logger.error('skip', 'Error skipping track:', e);
            await message.react('❌');
        }
    }
}