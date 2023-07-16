const Command = require("../../types/command");
const { PermissionsBitField } = require('discord.js');

module.exports = class extends Command {
    constructor(client, database) {
        super(client, database, {
            name: 'ban',
            aliases: [],
            category: 'moderator',
            permissions: ['BanMembers'],
            args: [{
                name: 'member',
                type: 'user',
                required: true
            }, {
                name: 'reason',
                type: 'string'
            }],
            guild_only: true
        });
    }

    async banUser(author, member, reason, locale) {
        if (!member)
            return Command.createErrorEmbed(locale('ban.no_member'));

        if (member.id === author.id)
            return Command.createErrorEmbed(locale('ban.self'));

        const isOwner = member.id === member.guild.ownerId;
        const isAdmin = member.permissions.has(PermissionsBitField.Flags.Administrator);
        const isBotOwner = this.config.bot.owners.includes(author.id);

        if (!isOwner && !isAdmin && !isBotOwner && member.roles.highest.position >= author.roles.highest.position)
            return Command.createErrorEmbed(locale('ban.higher_role'));

        if (!member.bannable)
            return Command.createErrorEmbed(locale('ban.not_bannable'));

        if (reason && reason.length === 0)
            reason = null;

        try {
            await member.ban({ reason: reason ?? locale('ban.no_reason') });
        } catch (e) {
            return Command.createErrorEmbed(locale('ban.failed'));
        }

        return Command.createEmbed({
            title: locale('ban.title', member.user.tag.stripTag(true)),
            description: locale('ban.description', reason ?? locale('ban.no_reason')),
            author: {
                name: author.user.username,
                iconURL: author.user.avatarURL()
            },
            timestamp: true,
            footer: { text: `ID: ${member.id}` },
            thumbnail: member.user.avatarURL()
        })
    }

    async runAsSlash(interaction, locale, args) {
        if (!args.member)
            return interaction.reply({ embeds: [Command.createErrorEmbed(locale('ban.no_member'))] });

        let member;
        try {
            member = await Command.loadMember(interaction.guild, args.member);
        }
        catch (e) {
            return interaction.reply({ embeds: [Command.createErrorEmbed(locale('ban.no_member'))] });
        }

        interaction.reply({ embeds: [await this.banUser(interaction.member, member, args.reason, locale)] });
    }

    async run(message, locale, args) {
        if (args.length < 1)
            return message.channel.send({ embeds: [Command.createErrorEmbed(locale('ban.no_member'))] });

        let member;
        try {
            member = await Command.loadMember(message.guild, args[0]);
        }
        catch (e) {
            return message.channel.send({ embeds: [Command.createErrorEmbed(locale('ban.no_member'))] });
        }

        message.reply({ embeds: [await this.banUser(message.member, member, args.slice(1).join(' '), locale)] });
    }
}