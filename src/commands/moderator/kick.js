const Command = require("../../types/command");

module.exports = class extends Command {
    constructor(client, database) {
        super(client, database, {
            name: 'kick',
            aliases: [],
            category: 'moderator',
            permissions: ['KickMembers'],
            args: [{
                name: 'member',
                type: 'user',
                required: true
            }, {
                name: 'reason',
                type: 'string'
            }]
        });
    }

    async kickUser(author, member, reason, locale) {
        if (!member)
            return Command.createErrorEmbed(locale('kick.no_member'));

        if (member.id === author.id)
            return Command.createErrorEmbed(locale('kick.self'));

        if (member.roles.highest.position >= author.roles.highest.position)
            return Command.createErrorEmbed(locale('kick.higher_role'));

        if (!member.kickable)
            return Command.createErrorEmbed(locale('kick.not_kickable'));

        if (reason && reason.length === 0)
            reason = null;

        try {
            await member.kick(reason ?? locale('kick.no_reason'));
        } catch (e) {
            return Command.createErrorEmbed(locale('kick.failed'));
        }

        return Command.createEmbed({
            title: locale('kick.title', member.user.tag),
            description: locale('kick.description', reason ?? locale('kick.no_reason')),
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
            return interaction.reply({ embeds: [Command.createErrorEmbed(locale('kick.no_member'))] });

        let member;
        try {
            member = await Command.loadMember(interaction.guild, args.member);
        }
        catch (e) {
            return interaction.reply({ embeds: [Command.createErrorEmbed(locale('kick.no_member'))] });
        }

        interaction.reply({ embeds: [await this.kickUser(interaction.member, member, args.reason, locale)] });
    }

    async run(message, locale, args) {
        if (args.length < 1)
            return message.channel.send({ embeds: [Command.createErrorEmbed(locale('kick.no_member'))] });

        let member;
        try {
            member = await Command.loadMember(message.guild, args[0]);
        }
        catch (e) {
            return message.channel.send({ embeds: [Command.createErrorEmbed(locale('kick.no_member'))] });
        }

        message.reply({ embeds: [await this.kickUser(message.member, member, args.slice(1).join(' '), locale)] });
    }
}