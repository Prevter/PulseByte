const Command = require("../../types/command");

module.exports = class extends Command {
    constructor(client, database) {
        super(client, database, {
            name: 'clean',
            aliases: ['clear', 'purge', 'cls'],
            category: 'moderator',
            permissions: ['ManageMessages'],
            args: [{
                name: 'count',
                type: 'integer',
                required: true
            }]
        });
    }

    async clearMessages(channel, count) {
        const messages = await channel.messages.fetch({ limit: count });
        await channel.bulkDelete(messages);
    }

    async runAsSlash(interaction, locale, args) {
        await interaction.deferReply({ ephemeral: true });

        const count = args.count;
        if (count < 1 || count > 100)
            return await interaction.editReply({ embeds: [Command.createErrorEmbed(locale('clean.invalid_count'))], ephemeral: true });

        try {
            await this.clearMessages(interaction.channel, count);
        } catch (e) {
            return await interaction.editReply({ embeds: [Command.createErrorEmbed(locale('clean.failed'))], ephemeral: true });
        }

        await interaction.editReply({ embeds: [Command.createEmbed({ description: locale('clean.success', count ) })], ephemeral: true });
        await sleep(5000);
        await interaction.deleteReply();
    }

    async run(message, locale, args) {
        const count = parseInt(args[0]);
        if (isNaN(count) || count < 1 || count > 100)
            return await message.reply({ embeds: [Command.createErrorEmbed(locale('clean.invalid_count'))] });

        try {
            await this.clearMessages(message.channel, count);
        } catch (e) {
            return await message.reply({ embeds: [Command.createErrorEmbed(locale('clean.failed'))] });
        }
    }
}