const { EmbedBuilder } = require('discord.js');
const { xp } = require('../config.json');

const translations = {
    en: {
        desc: "Check your experience points",
        args: {
            "user": "User to check"
        },
        notEnabled: "❌ Experience is disabled on this server",
        noXp: "❌ {0} has no experience points",
        embedTitle: "{0}'s stats",
        embedDesc: "XP: {0}\nLevel: {1}",
        progress: "Progress",
    },
    uk: {
        desc: "Перевірити свої бали досвіду",
        args: {
            "user": "Користувач для перевірки"
        },
        notEnabled: "❌ Досвід вимкнено на цьому сервері",
        noXp: "❌ {0} не має балів досвіду",
        embedTitle: "Статистика {0}",
        embedDesc: "XP: {0}\nРівень: {1}",
        progress: "Прогрес",
    },
};

const getLevel = (experience) => {
    return Math.floor(xp.level_rate * Math.sqrt(experience));
};

module.exports = {
    name: "xp",
    aliases: ["хп", "хр", "experience", "досвід"],
    arguments: [
        {
            name: "user",
            type: "user",
        }
    ],
    translations: translations,
    guildOnly: true,
    run: async (args, db, locale, callback, meta) => {
        if (!translations.hasOwnProperty(locale))
            locale = "en";
        
        if (xp.enabled === false) {
            callback({ type: 'text', content: translations[locale].notEnabled });
            return;
        }

        let user = meta.message.author;
        if (args.user) {
            if (args.user.user)
                user = args.user.user;
            else
                user = args.user;
        }
        
        let sql = `SELECT * FROM experience WHERE user_id = '${user.id}' AND guild_id = '${meta.message.guild.id}'`;
        let row = db.prepare(sql).get();

        let embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle(translations[locale].embedTitle.replace('{0}', user.username + '#' + user.discriminator));

        if (!row) {
            embed.setDescription(translations[locale].noXp.replace('{0}', user.username));
        }
        else {
            let level = getLevel(row.xp);
            let xpToNextLevel = row.xp;
            do {
                xpToNextLevel++;
            } while (getLevel(xpToNextLevel) <= level);

            let xpBar = '';
            for (let i = 0; i < 15; i++) {
                if (i < Math.floor(row.xp / xpToNextLevel * 15))
                    xpBar += '▓';
                else
                    xpBar += '░';
            }
            
            embed.addFields({ name: translations[locale].progress, value: `${xpBar} ${row.xp}/${xpToNextLevel}`});
            embed.setDescription(translations[locale].embedDesc.replace('{0}', row.xp).replace('{1}', level));
        }
        
        callback({ type: 'embed', content: embed });
    }
}