const Command = require("../../types/command");

module.exports = class extends Command {
    constructor(client, database) {
        super(client, database, {
            name: 'pause',
            aliases: ['resume', 'unpause'],
            category: 'music',
            guild_only: true
        });
    }

    async runAsSlash(interaction, locale, args) {
        const voiceChannel = interaction.member?.voice?.channel;
        if (!voiceChannel)
            return await interaction.reply({ embeds: [Command.createErrorEmbed(locale('pause.no_voice'))] });

        const queue = this.discord.distube.getQueue(interaction);
        if (!queue)
            return await interaction.reply({ embeds: [Command.createErrorEmbed(locale('pause.no_queue'))] });

        if (queue.paused) {
            await queue.resume();
            await interaction.reply({ embeds: [Command.createEmbed({ description: locale('pause.resumed') })] })
        }
        else {
            await queue.pause();
            await interaction.reply({ embeds: [Command.createEmbed({ description: locale('pause.paused') })] })
        }
    }

    async run(message, locale, args) {
        const voiceChannel = message.member?.voice?.channel;
        if (!voiceChannel)
            return await message.reply({ embeds: [Command.createErrorEmbed(locale('pause.no_voice'))] });

        const queue = this.discord.distube.getQueue(message);
        if (!queue)
            return await message.reply({ embeds: [Command.createErrorEmbed(locale('pause.no_queue'))] });

        if (queue.paused)
            await queue.resume();
        else
            await queue.pause();

        await message.react('✅');
    }
}