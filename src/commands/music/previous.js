const Command = require("../../types/command");

module.exports = class extends Command {
    constructor(client, database) {
        super(client, database, {
            name: 'previous',
            aliases: ['prev', 'back'],
            category: 'music',
            guild_only: true
        });
    }

    async runAsSlash(interaction, locale, args) {
        const voiceChannel = interaction.member?.voice?.channel;
        if (!voiceChannel)
            return await interaction.reply({ embeds: [Command.createErrorEmbed(locale('music.no_voice'))] });

        const queue = this.discord.distube.getQueue(interaction);
        if (!queue)
            return await interaction.reply({ embeds: [Command.createErrorEmbed(locale('music.no_queue'))] });

        await queue.previous();
        await interaction.reply({ embeds: [Command.createEmbed({ description: locale('previous.success') })] })
    }

    async run(message, locale, args) {
        const voiceChannel = message.member?.voice?.channel;
        if (!voiceChannel)
            return await message.reply({ embeds: [Command.createErrorEmbed(locale('music.no_voice'))] });

        const queue = this.discord.distube.getQueue(message);
        if (!queue)
            return await message.reply({ embeds: [Command.createErrorEmbed(locale('music.no_queue'))] });

        await queue.previous();
        await message.react('✅');
    }
}