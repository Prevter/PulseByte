const { EmbedBuilder } = require('discord.js');
const { Translator } = require('../common/utils');

const translations = {
    en: {
        desc: "Get information about yourself or someone else",
        args: {
            "user": "User to check"
        },
        infoAbout: "Information about {0}",
        nickname: "Nickname",
        joinedAt: "Joined at",
        createdAt: "Created at",
        roles: "Roles",
        mention: "Mention",
        avatarURL: "Avatar URL",
        requestedBy: "Requested by {0}",
    },
    uk: {
        desc: "Отримати інформацію про себе або когось іншого",
        args: {
            "user": "Користувач для перевірки"
        },
        infoAbout: "Інформація про {0}",
        nickname: "Нікнейм",
        joinedAt: "Приєднався",
        createdAt: "Створений",
        roles: "Ролі",
        mention: "Згадування",
        avatarURL: "Посилання на аватар",
        requestedBy: "Запитано {0}",
    },
};

const dateToString = (date) => {
    // Get the date as a string "HH:MM:SS DD/MM/YYYY" for GMT+0
    const dateStr = date.toISOString().split("T");
    const time = dateStr[1].split(".")[0];
    const dateArr = dateStr[0].split("-");
    return `${time} ${dateArr[2]}/${dateArr[1]}/${dateArr[0]}`;
}

module.exports = {
    name: "profile",
    category: "utils",
    aliases: ["профайл", "профіль", "юзер", "user"],
    arguments: [
        {
            name: "user",
            type: "user",
        }
    ],
    translations: translations,
    guildOnly: true,
    run: async (args, db, locale, callback, meta) => {
        let translate = new Translator(translations, locale);

        let user = meta.author;
        if (args.user) {
            if (args.user.user)
                user = args.user.user;
            else
                user = args.user;
        }

        try {
            const member = meta.guild.members.cache.get(user.id);

            // get user accent color
            let accentColor = user.accentColor;
            if (!accentColor) {
                // fetch user data from discord
                const userData = await user.fetch();
                accentColor = userData.accentColor;
            }


            let embed = new EmbedBuilder()
                .setColor(accentColor || 0x0099FF)
                .setTitle(user.tag)
                .setDescription(translate('infoAbout', user.tag))
                .setThumbnail(user.avatarURL())
                .addFields({ name: translate('nickname'), value: member.nickname || "None" })
                .addFields({ name: translate('createdAt'), value: dateToString(user.createdAt) || "Unknown", inline: true })
                .addFields({ name: translate('joinedAt'), value: dateToString(member.joinedAt) || "Unknown", inline: true })
                .addFields({ name: translate('roles'), value: member.roles.cache.map(role => role.name).join(", ") })
                .addFields({ name: "ID", value: user.id })
                .addFields({ name: translate('mention'), value: user.toString() })
                .addFields({ name: translate('avatarURL'), value: user.avatarURL() })
                .setFooter({ text: translate('requestedBy', meta.author.username), iconURL: meta.author.avatarURL() })

            callback({ type: "embed", content: embed });
        }
        catch (e) {
            callback({ type: "text", content: e.message });
            console.error(e);
        }
    }
}