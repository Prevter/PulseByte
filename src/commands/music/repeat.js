const Command = require("../../types/command");

module.exports = class extends Command {
    constructor(client, database) {
        super(client, database, {
            name: 'repeat',
            aliases: ['r'],
            category: 'music',
            guild_only: true,
            args: [{
                name: 'mode',
                type: 'choice',
                required: true,
                choices: [{
                    name: 'Off',
                    value: 'off'
                },{
                    name: 'Song',
                    value: 'song'
                },{
                    name: 'Queue',
                    value: 'queue'
                }],
            }]
        });
    }

    parseMode(mode) {
        switch (mode.toLowerCase()) {
            case 'off':
                return 0;
            case 'song':
                return 1;
            case 'queue':
                return 2;
            default:
                return null;
        }
    }

    async runAsSlash(interaction, locale, args) {
        await this.run(interaction, locale, [args.mode]);
    }

    async run(message, locale, args) {
        const voiceChannel = message.member?.voice?.channel;
        if (!voiceChannel)
            return await message.reply({ embeds: [Command.createErrorEmbed(locale('music.no_voice'))] });

        const queue = this.discord.distube.getQueue(message);
        if (!queue)
            return await message.reply({ embeds: [Command.createErrorEmbed(locale('music.no_queue'))] });

        if (!args[0])
            return await message.reply({ embeds: [Command.createErrorEmbed(locale('repeat.no_mode'))] });

        const repeatMode = this.parseMode(args[0]);
        if (repeatMode === null)
            return await message.reply({ embeds: [Command.createErrorEmbed(locale('repeat.invalid_mode'))] });

        queue.setRepeatMode(repeatMode);
        await message.reply({
            embeds: [Command.createEmbed({
                description: locale(`repeat.success.${repeatMode}`)
            })]
        })
    }
}