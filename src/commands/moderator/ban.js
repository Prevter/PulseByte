const Command = require("../../types/command");

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
            }]
        });
    }

    async banUser(author, member, reason, locale) {
        if (!member)
            return this.createErrorEmbed(locale('ban.no_member'));

        if (member.id === author.id)
            return this.createErrorEmbed(locale('ban.self'));

        if (member.roles.highest.position >= author.roles.highest.position)
            return this.createErrorEmbed(locale('ban.higher_role'));

        if (!member.bannable)
            return this.createErrorEmbed(locale('ban.not_bannable'));

        if (reason && reason.length === 0)
            reason = null;

        try {
            await member.ban({ reason: reason ?? locale('ban.no_reason') });
        } catch (e) {
            return this.createErrorEmbed(locale('ban.failed'));
        }

        return this.createEmbed({
            title: locale('ban.title', member.user.tag),
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
            return interaction.reply({ embeds: [this.createErrorEmbed(locale('ban.no_member'))] });

        let member;
        try {
            member = await this.loadMember(interaction.guild, args.member);
        }
        catch (e) {
            return interaction.reply({ embeds: [this.createErrorEmbed(locale('ban.no_member'))] });
        }

        interaction.reply({ embeds: [await this.banUser(interaction.member, member, args.reason, locale)] });
    }

    async run(message, locale, args) {
        if (args.length < 1)
            return message.channel.send({ embeds: [this.createErrorEmbed(locale('ban.no_member'))] });

        let member;
        try {
            member = await this.loadMember(message.guild, args[0]);
        }
        catch (e) {
            return message.channel.send({ embeds: [this.createErrorEmbed(locale('ban.no_member'))] });
        }

        message.reply({ embeds: [await this.banUser(message.member, member, args.slice(1).join(' '), locale)] });
    }
}