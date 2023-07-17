const Command = require("../../types/command");
const { PermissionsBitField } = require('discord.js');

module.exports = class extends Command {
    constructor(client, database) {
        super(client, database, {
            name: 'mute',
            aliases: [],
            category: 'moderator',
            permissions: ['ModerateMembers'],
            args: [{
                name: 'member',
                type: 'user',
                required: true
            },
            {
                name: 'time',
                type: 'string',
                required: true
            },
            {
                name: 'reason',
                type: 'string'
            }],
            guild_only: true
        });
    }

    parseTimeStr(timeStr) {
        const time = {
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0
        };

        const timeRegex = /(\d+)([dhms])/g;
        let match;
        while ((match = timeRegex.exec(timeStr)) !== null) {
            const amount = parseInt(match[1]);
            switch (match[2]) {
                case 'd':
                    time.days = amount;
                    break;
                case 'h':
                    time.hours = amount;
                    break;
                case 'm':
                    time.minutes = amount;
                    break;
                case 's':
                    time.seconds = amount;
                    break;
            }
        }

        const ms = time.seconds * 1000
            + time.minutes * 60 * 1000
            + time.hours * 60 * 60 * 1000
            + time.days * 24 * 60 * 60 * 1000;

        return ms;
    }

    async muteUser(author, member, time, reason, locale) {
        if (!member)
            return { result: false, embed: Command.createErrorEmbed(locale('mute.no_member')) };

        const parsedTime = this.parseTimeStr(time);
        if (parsedTime <= 0)
            return { result: false, embed: Command.createErrorEmbed(locale('mute.invalid_time')) };

        if (member.id === author.id)
            return { result: false, embed: Command.createErrorEmbed(locale('mute.self')) };

        const isOwner = member.id === member.guild.ownerId;
        const isAdmin = member.permissions.has(PermissionsBitField.Flags.Administrator);
        const isBotOwner = this.config.bot.owners.includes(author.id);

        if (!isOwner && !isAdmin && !isBotOwner && member.roles.highest.position >= author.roles.highest.position)
            return { result: false, embed: Command.createErrorEmbed(locale('mute.higher_role')) };

        if (!member.moderatable)
            return { result: false, embed: Command.createErrorEmbed(locale('mute.not_muteable')) };

        if (reason && reason.length === 0)
            reason = null;

        try {
            await member.timeout(parsedTime, reason ?? locale('mute.no_reason'));
        } catch (e) {
            return { result: false, embed: Command.createErrorEmbed(locale('mute.failed')) };
        }

        return {
            result: true,
            embed: Command.createEmbed({
                title: locale('mute.title', member.user.tag.stripTag(true)),
                description: locale('mute.description', reason ?? locale('mute.no_reason'), time),
                author: {
                    name: author.user.username,
                    iconURL: author.user.avatarURL()
                },
                timestamp: true,
                footer: { text: `ID: ${member.id}` },
                thumbnail: member.user.avatarURL()
            })
        }
    }

    async runAsSlash(interaction, locale, args) {
        if (!args.member)
            return interaction.reply({ embeds: [Command.createErrorEmbed(locale('mute.no_member'))] });

        if (!args.time)
            return interaction.reply({ embeds: [Command.createErrorEmbed(locale('mute.no_time'))] });

        let member;
        try {
            member = await Command.loadMember(interaction.guild, args.member);
        }
        catch (e) {
            return interaction.reply({ embeds: [Command.createErrorEmbed(locale('mute.no_member'))] });
        }

        const { result, embed } = await this.muteUser(interaction.member, member, args.time, args.reason, locale);
        if (!result)
            return interaction.reply({ embeds: [embed], ephemeral: true });

        if (interaction.guild_data.log_channel) {
            const channel = interaction.guild.channels.cache.get(interaction.guild_data.log_channel);
            if (channel) {
                await interaction.reply({ embeds: [embed], ephemeral: true });
                return await channel.send({ embeds: [embed] });
            }
        }

        await interaction.reply({ embeds: [embed] });
    }

    async run(message, locale, args) {
        if (args.length < 1)
            return message.channel.send({ embeds: [Command.createErrorEmbed(locale('mute.no_member'))] });

        if (args.length < 2)
            return message.channel.send({ embeds: [Command.createErrorEmbed(locale('mute.no_time'))] });

        let member;
        try {
            member = await Command.loadMember(message.guild, args[0]);
        }
        catch (e) {
            return message.channel.send({ embeds: [Command.createErrorEmbed(locale('mute.no_member'))] });
        }

        const { result, embed } = await this.muteUser(message.member, member, args[1], args.slice(2).join(' '), locale);
        if (!result)
            return message.reply({ embeds: [embed], ephemeral: true });

        if (message.guild_data.log_channel) {
            const channel = message.guild.channels.cache.get(message.guild_data.log_channel);
            if (channel) {
                await message.react('✅');
                return await channel.send({ embeds: [embed] });
            }
        }

        await message.reply({ embeds: [embed] });
    }
}