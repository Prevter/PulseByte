const { PermissionsBitField } = require('discord.js');
const config = require('../../config');
const localeBuilder = require('../locale');

module.exports = async (client, message) => {
    if (message.author.bot) return;

    let guild = null;
    let user = null;
    if (message.guild) {
        guild = await client.database.getGuild(message.guild.id);
        if (!guild) {
            guild = {
                id: message.guild.id,
                prefix: config.bot.prefix,
                language: config.default_language,
                xp_enabled: config.bot.xp.enabled
            };
            await client.database.createGuild(guild);
        }

        user = await client.database.getUser(message.author.id, message.guild.id);
    }

    message.guild_data = guild;
    message.user_data = user;

    const locale = localeBuilder(guild ? guild.language : config.default_language);

    for (const module of client.modules) {
        module.onMessage(message, locale, guild, user);
    }

    const prefix = guild ? guild.prefix : config.bot.prefix;
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    const cmd = client.commands.find(c => c.name === command || c.aliases.includes(command));
    if (!cmd) return;

    client.logger.log(`📨 ${message.author.tag} called a command: ${message.content}`)

    if (cmd.slash_only)
        return message.reply(locale('global.slash_only'));

    if (cmd.owner_only && !config.bot.owners.includes(message.author.id))
        return message.reply(locale('global.owner_only'));

    if (cmd.guild_only && !message.guild)
        return message.reply(locale('global.guild_only'));

    if (cmd.admin_only && !message.member.permissions.has(PermissionsBitField.Flags.Administrator))
        return message.reply(locale('global.admin_only'));

    if (cmd.permissions.length > 0) {
        const missing = message.member.permissions
            .missing(cmd.permissions)
            .map(p => locale(`permissions.${p}`) ?? p);
        if (missing.length > 0)
            return message.reply(locale('global.missing_permissions', missing.join(', ')));
    }

    await cmd.run(message, locale, args);
}