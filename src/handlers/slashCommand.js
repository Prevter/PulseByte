const { PermissionsBitField } = require('discord.js');
const config = require('../../config');
const localeBuilder = require('../locale');
const Command = require('../types/command');
require('../utils.js')

module.exports = {
    name: 'interactionCreate',
    async execute(client, interaction) {
        if (!interaction.isChatInputCommand()) return;

        let guild = null;
        let user = null;
        if (interaction.guild) {
            guild = await client.database.getGuild(interaction.guild.id);
            if (!guild) {
                guild = await client.database.createGuild(interaction.guild.id);
            }

            user = await client.database.getUser(interaction.user.id, interaction.guild.id);
        }

        interaction.guild_data = guild;
        interaction.user_data = user;

        const arg_string = interaction.options.data.map(o => o.value).join(' ');
        client.logger.log('Interaction', `📨 ${interaction.user.tag.stripTag(true)} called a slash command: ${interaction.commandName} ${arg_string}`)

        await client.database.incrementSlashCommandUsage();

        const locale = localeBuilder(guild ? guild.language : config.default_language);

        const cmd = client.commands.find(c => c.name === interaction.commandName);
        if (!cmd) return;

        if (cmd.owner_only && !config.bot.owners.includes(interaction.user.id))
            return interaction.reply({ embeds: [Command.createErrorEmbed(locale('global.owner_only'))], ephemeral: true });

        if (cmd.guild_only && !interaction.guild)
            return interaction.reply({ embeds: [Command.createErrorEmbed(locale('global.guild_only'))], ephemeral: true });

        if (cmd.admin_only && !interaction.member.permissions.has(PermissionsBitField.Flags.Administrator))
            return interaction.reply({ embeds: [Command.createErrorEmbed(locale('global.admin_only'))], ephemeral: true });

        if (cmd.permissions.length > 0) {
            const missing = interaction.member.permissions.missing(cmd.permissions);
            if (missing.length > 0)
                return interaction.reply({ embeds: [Command.createErrorEmbed(locale('global.missing_permissions', missing.join(', ')))], ephemeral: true });
        }

        // parse all arguments to an object
        const args = {};
        for (let i = 0; i < cmd.args.length; i++) {
            const arg = cmd.args[i];
            const value = interaction.options.get(arg.name);
            if (!value) {
                if (arg.required) {
                    return interaction.reply({ embeds: [Command.createErrorEmbed(locale('global.missing_argument', arg.name))], ephemeral: true });
                } else {
                    args[arg.name] = arg.default;
                }
            } else {
                args[arg.name] = value.value;
            }
        }

        await cmd.runAsSlash(interaction, locale, args);
    }
}