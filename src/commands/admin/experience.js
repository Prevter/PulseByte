const Command = require("../../types/command");

module.exports = class extends Command {
    constructor(client, database) {
        super(client, database, {
            name: 'experience',
            category: 'admin',
            admin_only: true,
            guild_only: true
        });
    }

    async runAsSlash(interaction, locale, args) {
        let arg = [];
        if (args.enable) {
            arg.push(args.enable);
        }
        await this.run(interaction, locale, arg);
    }

    async run(message, locale, args) {
        message.guild_data.xp_enabled = !message.guild_data.xp_enabled;
        await this.database.updateGuild(message.guild_data);
        await message.reply({
            embeds: [Command.createEmbed({
                description: locale('experience.current', message.guild_data.xp_enabled ? locale('global.enabled') : locale('global.disabled'))
            })]
        });
    }
}