const { EmbedBuilder } = require('discord.js');
const { xp } = require('../config.json');

const translations = {
    en: {
        desc: "Check global leaderboard on this server",
        args: {
            "page": "Leaderboard page"
        },
        notEnabled: "❌ Experience is disabled on this server",
        embedTitle: "Top users",
        level: "Level",
    },
    uk: {
        desc: "Перевірити глобальний топ на цьому сервері",
        args: {
            "page": "Сторінка топу"
        },
        notEnabled: "❌ Досвід вимкнено на цьому сервері",
        embedTitle: "Топ користувачів",
        level: "Рівень",
    },
};

const getLevel = (experience) => {
    return Math.floor(xp.level_rate * Math.sqrt(experience));
};

module.exports = {
    name: "rating",
    aliases: ["рейтинг", "leaderboard", "lb", "топ", "top", "лб", "лідерборд", "лідери"],
    arguments: [
        {
            name: "page",
            type: "number"
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

        let page = 0;
        if (args.page)
            page = args.page - 1;

        let sql = `SELECT * FROM experience WHERE guild_id = '${meta.message.guild.id}' ORDER BY xp DESC LIMIT ${page}, 10`;
        let rows = db.prepare(sql).all();

        if (rows.length === 0)
            return callback({ type: 'text', content: "❌ No users found" });

        let embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle(translations[locale].embedTitle);
        
        let i = 1;
        for (let row of rows) {
            let user_id = row.user_id;
            let user = await meta.guild.members.fetch(user_id);

            if (!user)
                user = `${user_id}`;
            else
                user = user.nickname;


            let xp = row.xp;
            let level = getLevel(xp);
            
            embed.addFields({ name: `${i}. ${user}`, value: `XP: ${xp}\n${translations[locale].level}: ${level}` });
            i++;
        }
        
        callback({ type: 'embed', content: embed });
    }
}