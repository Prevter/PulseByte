const Command = require("../../types/command");

module.exports = class extends Command {
    constructor(client, database) {
        super(client, database, {
            name: 'prefix',
            args: [{
                name: 'prefix',
                type: 'string'
            }],
            category: 'admin',
            admin_only: true,
            guild_only: true
        });
    }

    async runAsSlash(interaction, locale, args) {
        let arg = [];
        if (args.prefix) {
            arg.push(args.prefix);
        }
        await this.run(interaction, locale, arg);
    }

    async run(message, locale, args) {
        if (args.length === 0) {
            return await message.reply({
                embeds: [
                    Command.createEmbed({ description: locale('prefix.current', message.guild_data.prefix) })
                ]
            });
        }

        const prefix = args.join(' ');
        if (prefix.length > 5) {
            return await message.reply({
                embeds: [
                    Command.createEmbed({
                        description: locale('prefix.too_long')
                    })]
            });
        }

        message.guild_data.prefix = prefix;
        await this.database.updateGuild(message.guild_data);
        await message.reply({
            embeds: [
                Command.createEmbed({ description: locale('prefix.updated', prefix) })
            ]
        });
    }
}