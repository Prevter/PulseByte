const Command = require("../../types/command");

module.exports = class extends Command {
    constructor(client, database) {
        super(client, database, {
            name: 'autoplay',
            aliases: ['auto'],
            category: 'music',
            guild_only: true
        });
    }

    async run(message, locale, args) {
        const voiceChannel = message.member?.voice?.channel;
        if (!voiceChannel)
            return await message.reply({ embeds: [Command.createErrorEmbed(locale('music.no_voice'))] });

        const queue = this.discord.distube.getQueue(message);
        if (!queue)
            return await message.reply({ embeds: [Command.createErrorEmbed(locale('music.no_queue'))] });

        const autoplay = queue.toggleAutoplay();
        await message.reply({
            embeds: [Command.createEmbed({
                description: locale(
                    'autoplay.success',
                    autoplay ? '🟢' : '🔴',
                    autoplay ? locale('global.enabled') : locale('global.disabled')
                )
            })]
        })
    }
}