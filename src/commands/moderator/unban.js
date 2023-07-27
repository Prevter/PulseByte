const Command = require("../../types/command");

module.exports = class extends Command {
    constructor(client, database) {
        super(client, database, {
            name: 'unban',
            aliases: [],
            category: 'moderator',
            permissions: ['BanMembers'],
            args: [{
                name: 'member',
                type: 'user',
                required: true
            }],
            guild_only: true
        });
    }

    async unbanUser(author, member_id, locale, guild) {
        if (!member_id)
            return Command.createErrorEmbed(locale('unban.no_member'));

        try {
            await guild.members.unban(member_id);
        } catch (e) {
            return Command.createErrorEmbed(locale('unban.failed'));
        }

        let member = { user: { tag: member_id, avatarURL: () => '' } };
        try {
            member = await guild.members.fetch(member_id);
        } catch (e) { /* empty */ }

        return Command.createEmbed({
            title: locale('unban.title', member.user.tag.stripTag(true)),
            author: {
                name: author.user.username,
                iconURL: author.user.avatarURL()
            },
            timestamp: true,
            footer: { text: `ID: ${member_id}` },
            thumbnail: member.user.avatarURL()
        })
    }

    getMemberId(member) {
        if (member.startsWith('<@') && member.endsWith('>')) {
            member = member.slice(2, -1);
            if (member.startsWith('!')) {
                member = member.slice(1);
            }
        }
        return member;
    }

    async runAsSlash(interaction, locale, args) {
        if (!args.member)
            return interaction.reply({ embeds: [Command.createErrorEmbed(locale('unmute.no_member'))] });

        const member = this.getMemberId(args.member);
        interaction.reply({ embeds: [await this.unbanUser(interaction.member, member, locale, interaction.guild)] });
    }

    async run(message, locale, args) {
        if (args.length < 1)
            return message.channel.send({ embeds: [Command.createErrorEmbed(locale('unmute.no_member'))] });

        const member = this.getMemberId(args[0]);
        message.reply({ embeds: [await this.unbanUser(message.member, member, locale, message.guild)] });
    }
}