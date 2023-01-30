const { AttachmentBuilder, EmbedBuilder } = require('discord.js');
const { join } = require('path');
const Canvas = require('@napi-rs/canvas');
const { xp } = require('../config.json');
const { request } = require('undici');

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
        level: "Level",
        rank: "Rank",
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
        level: "Рівень",
        rank: "Ранг",
    },
};

function nFormatter(num, digits) {
    const lookup = [
        { value: 1, symbol: "" },
        { value: 1e3, symbol: "k" },
        { value: 1e6, symbol: "M" },
        { value: 1e9, symbol: "G" },
        { value: 1e12, symbol: "T" },
        { value: 1e15, symbol: "P" },
        { value: 1e18, symbol: "E" }
    ];
    const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
    var item = lookup.slice().reverse().find(function(item) {
        return num >= item.value;
    });
    return item ? (num / item.value).toFixed(digits).replace(rx, "$1") + item.symbol : "0";
}

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
            callback({ type: 'embed', content: embed });
            return;
        }

        let level = getLevel(row.xp);
        let xpToNextLevel = row.xp;
        do {
            xpToNextLevel++;
        } while (getLevel(xpToNextLevel) <= level);

        // get rank of user in guild
        sql = `SELECT * FROM experience WHERE guild_id = '${meta.message.guild.id}' ORDER BY xp DESC`;
        let rows = db.prepare(sql).all();
        let rank = 0;
        for (let i = 0; i < rows.length; i++) {
            if (rows[i].user_id === user.id) {
                rank = i + 1;
                break;
            }
        }

        const canvas = Canvas.createCanvas(700, 200);
        const context = canvas.getContext('2d');

        const background = await Canvas.loadImage(join(__dirname, '../assets/background.png'));
        context.drawImage(background, 0, 0, canvas.width, canvas.height);

        const avatarURL = user.displayAvatarURL({ extension: 'jpg' });
        const { body } = await request(avatarURL);
        const avatar = await Canvas.loadImage(await body.arrayBuffer());
        
        // Show nickname
        const drawName = (user, x, y) => {
            context.save();
            context.font = 'bold 32px sans-serif';
            context.fillStyle = '#ffffff';
            context.fillText(user.username, x, y);
            // get text width
            const textWidth = context.measureText(user.username).width;
            // Add discriminator
            context.font = 'bold 30px sans-serif';
            context.fillStyle = '#aaaaaa';
            context.fillText('#' + user.discriminator, x + textWidth + 5, y);
            context.restore();
        };

        const drawLevel = (level, x, y) => {
            // it will be aligned to the right
            context.save();
            context.textAlign = 'right';
            context.font = '48px sans-serif';
            context.fillStyle = '#ffffff';
            context.fillText(`${level}`, x, y);
            const textWidth = context.measureText(`${level}`).width;
            context.font = 'bold 24px sans-serif';
            context.fillStyle = '#cccccc';
            context.fillText(translations[locale].level, x - textWidth - 8, y);
            // it should return it's width
            const finalWidth = context.measureText(translations[locale].level).width;
            context.restore();
            return finalWidth + textWidth + 5;
        };

        const drawRank = (rank, x, y) => {
            context.save();
            context.textAlign = 'right';
            context.font = '48px sans-serif';
            context.fillStyle = '#ffffff';
            context.fillText(`#${rank}`, x, y);
            const textWidth = context.measureText(`#${rank}`).width;
            context.font = 'bold 24px sans-serif';
            context.fillStyle = '#cccccc';
            context.fillText(translations[locale].rank, x - textWidth - 8, y);
            context.restore();
        };

        const drawXP = (xp, next_level, x, y) => {
            context.save();
            const first = nFormatter(xp, 2)
            const second = ` / ${nFormatter(next_level, 2)} XP`;
            context.textAlign = 'right';
            context.font = 'bold 24px sans-serif';
            context.fillStyle = '#aaaaaa';
            context.fillText(second, x, y);
            const textWidth = context.measureText(second).width;
            context.fillStyle = '#ffffff';
            context.fillText(first, x - textWidth, y);
            context.restore();
        };

        const drawProgressBar = (current, max, x, y, width, height) => {
            context.save();

            // draw background
            context.fillStyle = '#ffffff';
            context.beginPath();
            context.roundRect(x, y, width, height, 20);
            context.fill();

            // draw progress
            context.fillStyle = '#9999ff';
            context.beginPath();
            context.roundRect(x, y, width * (current / max), height, 20);
            context.fill();
            
            context.restore();
        };

        const drawAvatar = (avatar, x, y, width, height) => {
            context.save();
            context.beginPath();
            context.arc(x + width / 2, y + height / 2, width / 2, 0, Math.PI * 2, true);
            context.closePath();
            context.clip();
            context.drawImage(avatar, x, y, width, height);
            context.restore();
        };
        
        drawAvatar(avatar, 36, 36, 128, 128);
        drawName(user, 180, 110);
        drawXP(row.xp, xpToNextLevel, canvas.width - 32, 110);
        const offset = drawLevel(level, canvas.width - 32, 64);
        drawRank(rank, canvas.width - 48 - offset, 64);
        drawProgressBar(row.xp, xpToNextLevel, 180, 130, canvas.width - 216, 24);

        const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'card.png' });
        callback({ type: 'attachment', content: attachment });
    }
}