const { EmbedBuilder } = require('discord.js');
const { Translator } = require('../common/utils');

const translations = {
    en: {
        desc: "Ban someone on the server",
        args: {
            person: "Person to ban",
            reason: "Ban reason",
        },
        noTarget: "Please select person to ban",
        noReason: "Please specify ban reason",
        embedTitle: "{0} was banned!",
        embedDesc: "Reason: {0}",
        banYourself: "You cannot ban yourself!",
        higherRole: "Person you tried to ban have a more higher role than you.",
        unbannable: "I don't have enough permissions to ban that person",
    },
    uk: {
        desc: "Заблокувати когось на сервері",
        args: {
            person: "Користувач якого треба заблокувати",
            reason: "Причина бану",
        },
        noTarget: "Будь-ласка вкажіть кого потрібно забанити",
        noReason: "Будь-ласка вкажіть причину бану",
        embedTitle: "{0} було заблоковано!",
        embedDesc: "Причина: {0}",
        banYourself: "Ви не можете забанити себе!",
        higherRole: "Учасник якого ви хочете забанити має більш високу роль ніж ви",
        unbannable: "Я не маю достатньо прав щоб забанити цього учасника",
    },
};

module.exports = {
    name: "ban",
    category: "mod",
    aliases: ["бан", "забань", "заблокуй"],
    arguments: [
        {
            name: "person",
            type: "user",
            isRequired: true
        },
        {
            name: "reason",
            type: "string",
            isRequired: true,
            longString: true,
            useQuotes: false,
        }
    ],
    guildOnly: true,
    permissions: ['BanMembers'],
    translations: translations,
    run: async (args, db, locale, callback, meta) => {
        let translate = new Translator(translations, locale);
        if (!args.person) {
            callback({ type: 'text', content: translate('noTarget') })
            return;
        }

        if (!args.reason) {
            callback({ type: 'text', content: translate('noReason') })
            return;
        }

        if (args.person.id === meta.author.id)
            return callback({ type: 'text', content: translate('banYourself') })

        if (meta.member.roles.highest.position < args.person.roles.highest.position)
            return callback({ type: 'text', content: translate('higherRole') })

        if (!args.person.bannable)
            return callback({ type: 'text', content: translate('unbannable') })

        await args.person.ban({
            reason: args.reason
        });

        let embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle(translate('embedTitle', args.person.user.tag))
            .setDescription(translate('embedDesc', args.reason))
            .setAuthor({ name: meta.author.username, iconURL: meta.author.avatarURL() })
            .setTimestamp()
            .setFooter({ text: `ID: ${args.person.id}` })
            .setThumbnail(args.person.user.avatarURL());

        callback({ type: 'embed', content: embed });
    }
}