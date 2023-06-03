const Command = require("../../types/command");

module.exports = class extends Command {
    constructor(client, database) {
        super(client, database, {
            name: 'leave',
            aliases: [],
            category: 'music',
            guild_only: true
        });
    }

    async runAsSlash(interaction, locale, args) {
        const disVoice = this.discord.distube.voices.get(interaction.guild.id);
        if (disVoice) {
            await this.discord.distube.voices.leave(interaction);
            return await interaction.reply({ embeds: [Command.createEmbed({ description: locale('leave.success') })] })
        }
        await interaction.reply({ embeds: [Command.createErrorEmbed(locale('leave.no_voice'))] });
    }

    async run(message, locale, args) {
        const disVoice = this.discord.distube.voices.get(message.guild.id);
        if (disVoice) {
            await this.discord.distube.voices.leave(message);
            await message.react('✅');
        }
    }
}