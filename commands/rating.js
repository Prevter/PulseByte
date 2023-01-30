const { EmbedBuilder } = require('discord.js');
const { xp } = require('../config.json');
const { getLevel } = require('../common/xpFunctions.js');
const { Translator } = require('../common/utils');

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
        let translate = new Translator(translations, locale);
        
        if (xp.enabled === false) {
            callback({ type: 'text', content: translate('notEnabled') });
            return;
        }

        let page = 0;
        if (args.page)
            page = args.page - 1;

        let sql = `SELECT * FROM experience WHERE guild_id = '${meta.message.guild.id}' ORDER BY xp DESC LIMIT ${page * 5}, 5`;
        let rows = db.prepare(sql).all();

        let embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle(translate('embedTitle'));
        
        let i = page * 5 + 1;
        for (let row of rows) {
            let user_id = row.user_id;
            let user = await meta.guild.members.fetch(user_id, { force: true });

            if (!user || !user.nickname)
                user = `<@${user_id}>`;
            else 
                user = user.nickname;

            let xp = row.xp;
            let level = getLevel(xp);
            
            embed.addFields({ name: `${i}. ${user}`, value: `XP: ${xp}\n${translate('level')}: ${level}` });
            i++;
        }
        
        callback({ type: 'embed', content: embed });
    }
}