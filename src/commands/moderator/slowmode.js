const Command = require("../../types/command");

module.exports = class extends Command {
    constructor(client, database) {
        super(client, database, {
            name: 'slowmode',
            aliases: ['slow'],
            category: 'moderator',
            permissions: ['ManageMessages'],
            args: [{
                name: 'duration',
                type: 'integer',
                required: true
            }],
            guild_only: true
        });
    }

    async slowMode(channel, duration) {
        await channel.setRateLimitPerUser(duration);
    }

    async runAsSlash(interaction, locale, args) {
        await interaction.deferReply();

        const duration = args.duration;
        if (duration < 0 || duration > 21600)
            return await interaction.editReply({ embeds: [Command.createErrorEmbed(locale('slowmode.invalid_duration'))] });

        try {
            await this.slowMode(interaction.channel, duration);
        } catch (e) {
            this.logger.error(e);
            return await interaction.editReply({ embeds: [Command.createErrorEmbed(locale('slowmode.failed'))] });
        }

        if (duration === 0)
            return await interaction.editReply({ embeds: [Command.createEmbed({ description: locale('slowmode.disabled') })] });

        await interaction.editReply({ embeds: [Command.createEmbed({ description: locale('slowmode.success', duration) })] });
    }

    async run(message, locale, args) {
        const duration = parseInt(args[0]);
        if (isNaN(duration) || duration < 0 || duration > 21600)
            return await message.reply({ embeds: [Command.createErrorEmbed(locale('slowmode.invalid_duration'))] });

        try {
            await this.slowMode(message.channel, duration);
        } catch (e) {
            this.logger.error(e);
            return await message.reply({ embeds: [Command.createErrorEmbed(locale('slowmode.failed'))] });
        }

        await message.react('✅');
    }
}