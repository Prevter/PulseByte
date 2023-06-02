const Command = require("../../types/command");

module.exports = class extends Command {
    constructor(client, database) {
        super(client, database, {
            name: 'unmute',
            aliases: [],
            category: 'moderator',
            permissions: ['ModerateMembers'],
            args: [{
                name: 'member',
                type: 'user',
                required: true
            }]
        });
    }

    async unmuteUser(author, member, locale) {
        if (!member)
            return this.createErrorEmbed(locale('unmute.no_member'));

        if (!member.moderatable)
            return this.createErrorEmbed(locale('unmute.not_unmuteable'));

        try {
            await member.timeout(null);
        }
        catch (e) {
            return this.createErrorEmbed(locale('unmute.failed'));
        }

        return this.createEmbed({
            title: locale('unmute.title', member.user.tag),
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
            return interaction.reply({ embeds: [this.createErrorEmbed(locale('unmute.no_member'))] });

        let member;
        try {
            member = await this.loadMember(interaction.guild, args.member);
        }
        catch (e) {
            return interaction.reply({ embeds: [this.createErrorEmbed(locale('unmute.no_member'))] });
        }

        interaction.reply({ embeds: [await this.unmuteUser(interaction.member, member, locale)] });
    }

    async run(message, locale, args) {
        if (args.length < 1)
            return message.channel.send({ embeds: [this.createErrorEmbed(locale('unmute.no_member'))] });

        let member;
        try {
            member = await this.loadMember(message.guild, args[0]);
        }
        catch (e) {
            return message.channel.send({ embeds: [this.createErrorEmbed(locale('unmute.no_member'))] });
        }
        message.reply({ embeds: [await this.unmuteUser(message.member, member, locale)] });
    }
}