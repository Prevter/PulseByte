const Module = require("../types/module");
const config = require('../../config');
const { PermissionsBitField } = require('discord.js');
const Command = require("../types/command");
require('../utils.js')

module.exports = class Automod extends Module {
    constructor(client, database) {
        super(client, database, 'Automod');

        this.cache = null;
        this.clearCache();
    }

    clearCache() {
        this.cache = {
            messages: [],
            warned_users: [],
            muted_users: []
        };
    }

    async clear_messages(messages) {
        if (!messages || messages.length == 0) return;

        // filter repeated message ids
        messages = messages.filter((m, i) => messages.findIndex(m2 => m2.message_id == m.message_id) == i);

        try {
            const channel = this.discord.channels.cache.get(messages[0].channel_id);
            if (!channel) return;

            await channel.bulkDelete(messages.map(m => m.message_id));
        }
        catch (err) {
            this.logger.error('AutoMod', 'Failed to delete spam messages:', err);
        }
    }

    async muteUser(message, locale, settings, reason, spam_messages = []) {
        const embed = Command.createEmbed({
            title: locale('automod.mute.title'),
            description: locale(`automod.mute.description.${reason}`),
            timestamp: true,
            footer: { text: `User ID: ${message.author.id}` },
            author: {
                name: message.author.tag.stripTag(),
                iconURL: message.author.avatarURL()
            }
        });

        this.cache.muted_users.push({
            user_id: message.author.id,
            timestamp: Date.now(),
            reason: reason,
            guild_id: message.guild.id
        });

        if (message.member.moderatable) {
            await message.member.timeout(settings.mute_time ?? 60000, locale('automod.reason.' + reason));
            this.logger.log('AutoMod', `Muted user ${message.author.tag.stripTag()} (${message.author.id}) in guild ${message.guild.name} (${message.guild.id}) for reason ${reason}`);
        }

        if (settings.clear_messages && spam_messages) {
            this.clear_messages(spam_messages);
        }

        if (!message.member.moderatable) return;

        const msg = await message.channel.send({ embeds: [embed] });
        if (settings.remove_bot_messages) {
            setTimeout(() => msg.delete(), settings.remove_bot_messages_time);
        }
    }

    async warnUser(message, locale, settings, reason, spam_messages = []) {
        const embed = Command.createEmbed({
            title: locale('automod.warn.title'),
            description: locale(`automod.warn.description.${reason}`),
            timestamp: true,
            footer: { text: `User ID: ${message.author.id}` },
            author: {
                name: message.author.tag.stripTag(),
                iconURL: message.author.avatarURL()
            }
        });

        this.cache.warned_users.push({
            user_id: message.author.id,
            timestamp: Date.now(),
            reason: reason,
            guild_id: message.guild.id
        });

        this.logger.log('AutoMod', `Warned user ${message.author.tag.stripTag()} (${message.author.id}) in guild ${message.guild.name} (${message.guild.id}) for reason ${reason}`);

        if (settings.clear_messages && spam_messages) {
            this.clear_messages(spam_messages);
        }

        const msg = await message.channel.send({ embeds: [embed] });
        if (settings.remove_bot_messages) {
            setTimeout(() => msg.delete(), settings.remove_bot_messages_time);
        }
    }

    async onMessage(message, locale, guild_data, user_data) {
        if (!guild_data) return;
        if (!guild_data.automod_enabled) return;

        const is_owner = config.bot.owners.includes(message.author.id);
        const is_admin = message.member.permissions.has(PermissionsBitField.Flags.Administrator);

        // if (is_owner || is_admin) return;

        // TODO: add automod settings to database
        // const automod_settiigs = this.database.getAutomodSettings(message.guild.id);
        const automod_settings = {
            warn_limit: 3,
            mute_limit: 6,
            kick_limit: 9,

            max_interval: 2000,
            max_duplicates_interval: 10000,

            duplicates_kick_limit: 10,
            duplicates_mute_limit: 7,
            duplicates_warn_limit: 5,

            mute_time: 300000,

            kick_enabled: false,
            mute_enabled: true,
            warn_enabled: true,

            clear_messages: true,

            remove_bot_messages: true,
            remove_bot_messages_time: 30000,
        };

        const current_message = {
            message_id: message.id,
            guild_id: message.guild.id,
            user_id: message.author.id,
            channel_id: message.channel.id,
            content: message.content,
            timestamp: message.createdTimestamp
        };
        this.cache.messages.push(current_message);

        const cached_messages = this.cache.messages.filter(
            msg => msg.user_id === message.author.id
                && msg.guild_id === message.guild.id
        );

        const duplicate_messages = cached_messages.filter(
            msg => msg.content === message.content
                && msg.timestamp > (current_message.timestamp - automod_settings.max_duplicates_interval)
        );

        const other_duplicates = [];
        if (duplicate_messages.length > 0) {
            let row_broken = false;
            cached_messages
                .sort((a, b) => a.timestamp - b.timestamp)
                .forEach((msg, index) => {
                    if (row_broken) return;
                    if (msg.content !== duplicate_messages[0].content) row_broken = true;
                    else other_duplicates.push(msg);
                });
        }

        const spam_matches = cached_messages.filter(
            msg => msg.timestamp > Date.now() - automod_settings.max_interval
        );

        var infracted = false;
        const is_warned = this.cache.warned_users.find(
            user => user.user_id === message.author.id &&
                user.guild_id === message.guild.id
        );
        const is_muted = this.cache.muted_users.find(
            user => user.user_id === message.author.id &&
                user.guild_id === message.guild.id
        );

        // Kick user
        if (spam_matches.length >= automod_settings.kick_limit) {
            infracted = true;
            // TODO: kick user
        }
        else if (duplicate_messages.length >= automod_settings.duplicates_kick_limit) {
            infracted = true;
            // TODO: kick user
        }

        // Mute user
        const can_mute = automod_settings.mute_enabled && !infracted && is_warned && !is_muted;
        if (spam_matches.length >= automod_settings.mute_limit) {
            infracted = true;
            await this.muteUser(message, locale, automod_settings, 'spam', spam_matches)
        }
        else if (duplicate_messages.length >= automod_settings.duplicates_mute_limit) {
            infracted = true;
            await this.muteUser(message, locale, automod_settings, 'duplicates', [
                ...duplicate_messages,
                ...other_duplicates
            ]);
        }

        // Warn user
        const can_warn = automod_settings.warn_enabled && !infracted && !is_warned && !is_muted;
        if (can_warn && spam_matches.length >= automod_settings.warn_limit) {
            infracted = true;
            await this.warnUser(message, locale, automod_settings, 'spam', spam_matches);
        }
        else if (can_warn && duplicate_messages.length >= automod_settings.duplicates_warn_limit) {
            infracted = true;
            await this.warnUser(message, locale, automod_settings, 'duplicates', [
                ...duplicate_messages,
                ...other_duplicates
            ]);
        }
    }
}
