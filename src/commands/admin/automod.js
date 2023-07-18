const Command = require("../../types/command");

module.exports = class extends Command {
    constructor(client, database) {
        super(client, database, {
            name: 'automod',
            category: 'admin',
            admin_only: true,
            guild_only: true
        });
    }

    async run(message, locale, args) {
        message.guild_data.automod_enabled = !message.guild_data.automod_enabled;
        await this.database.updateGuild(message.guild_data);
        await message.reply({
            embeds: [Command.createEmbed({
                description: locale('automod.current', message.guild_data.automod_enabled ? locale('global.enabled') : locale('global.disabled'))
            })]
        });
    }
}