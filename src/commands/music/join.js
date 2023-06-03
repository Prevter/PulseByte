const Command = require("../../types/command");

module.exports = class extends Command {
    constructor(client, database) {
        super(client, database, {
            name: 'join',
            aliases: [],
            category: 'music',
            guild_only: true
        });
    }

    async runAsSlash(interaction, locale, args) {
        const voiceChannel = interaction.member?.voice?.channel;
        if (!voiceChannel)
            return await interaction.reply({ embeds: [Command.createErrorEmbed(locale('join.no_voice'))] });

        await this.discord.distube.voices.join(voiceChannel);
        await interaction.reply({ embeds: [Command.createEmbed({ description: locale('join.success') })] })
    }

    async run(message, locale, args) {
        const voiceChannel = message.member?.voice?.channel;
        if (!voiceChannel)
            return await message.reply({ embeds: [Command.createErrorEmbed(locale('join.no_voice'))] });

        await this.discord.distube.voices.join(voiceChannel);
        await message.react('✅');
    }
}