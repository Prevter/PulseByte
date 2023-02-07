const { AttachmentBuilder, EmbedBuilder } = require('discord.js');
const { join } = require('path');
const { createCanvas, GlobalFonts } = require('@napi-rs/canvas')
const { xp } = require('../config.json');
const { request } = require('undici');
const { getLevel, getLevelXp, isEnabledOnServer } = require('../common/xpFunctions.js');
const { Translator } = require('../common/utils');

const translations = {
    en: {
        desc: "Check your experience points",
        args: {
            "user": "User to check"
        },
        notEnabled: "❌ Experience is disabled on this server",
        noXp: "❌ {0} has no experience points",
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
    var item = lookup.slice().reverse().find(function (item) {
        return num >= item.value;
    });
    return item ? (num / item.value).toFixed(digits).replace(rx, "$1") + item.symbol : "0";
}

GlobalFonts.registerFromPath(join(__dirname, '../assets/OpenSans.ttf'), 'Open Sans');

module.exports = {
    name: "xp",
    category: "experience",
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
        let translate = new Translator(translations, locale);


        if (!isEnabledOnServer(db, meta.guild.id)) {
            callback({ type: 'text', content: translate('notEnabled') });
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

        let embed = new EmbedBuilder().setColor(0x0099FF)

        if (!row) {
            embed.setDescription(translate('noXp', user.username));
            callback({ type: 'embed', content: embed });
            return;
        }

        let level = getLevel(row.xp);
        let xpToPrevLevel = getLevelXp(level);
        let xpToNextLevel = getLevelXp(level + 1);
        let xpInLevel = row.xp - xpToPrevLevel;
        let xpForLevel = xpToNextLevel - xpToPrevLevel;

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

        const canvas = createCanvas(700, 200);
        const context = canvas.getContext('2d');

        const background = await Canvas.loadImage(join(__dirname, '../assets/background.png'));
        context.save();
        context.drawImage(background, 0, 0, canvas.width, canvas.height);
        context.globalCompositeOperation = 'color';
        const userData = await user.fetch();
        if (userData.accentColor === null)
            context.fillStyle = '#0099FF88';
        else {
            // convert to hex
            const hex = userData.accentColor.toString(16);
            const alpha = '88';
            let result = `${hex}${alpha}`
            if (hex.length === 5)
                result = '0' + result;
            else if (hex.length === 4)
                result = '00' + result;
            else if (hex.length === 3)
                result = '000' + result;
            else if (hex.length === 2)
                result = '0000' + result;
            else if (hex.length === 1)
                result = '00000' + result;

            context.fillStyle = `#${result}`;
        }
        console.log(context.fillStyle);
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.restore();

        const avatarURL = user.displayAvatarURL({ extension: 'jpg' });
        const { body } = await request(avatarURL);
        const avatar = await Canvas.loadImage(await body.arrayBuffer());

        // Show nickname
        const drawName = (user, x, y) => {
            context.save();
            context.font = 'bold 32px Open Sans';
            context.fillStyle = '#ffffff';
            // add text-shadow
            context.shadowColor = '#000000';
            context.shadowBlur = 5;
            context.shadowOffsetX = 2;
            context.shadowOffsetY = 2;
            context.fillText(user.username, x, y);
            // get text width
            const textWidth = context.measureText(user.username).width;
            // Add discriminator
            context.font = 'bold 30px Open Sans';
            context.fillStyle = '#aaaaaa';
            context.fillText('#' + user.discriminator, x + textWidth + 5, y);
            context.restore();
        };

        const drawLevel = (level, x, y) => {
            // it will be aligned to the right
            context.save();
            context.textAlign = 'right';
            context.font = '48px Open Sans';
            context.fillStyle = '#ffffff';
            // add text-shadow
            context.shadowColor = '#000000';
            context.shadowBlur = 5;
            context.shadowOffsetX = 2;
            context.shadowOffsetY = 2;
            context.fillText(`${level}`, x, y);
            const textWidth = context.measureText(`${level}`).width;
            context.font = 'bold 24px Open Sans';
            context.fillStyle = '#cccccc';
            context.fillText(translate('level'), x - textWidth - 8, y);
            // it should return it's width
            const finalWidth = context.measureText(translate('level')).width;
            context.restore();
            return finalWidth + textWidth + 5;
        };

        const drawRank = (rank, x, y) => {
            context.save();
            context.textAlign = 'right';
            context.font = '48px Open Sans';
            context.fillStyle = '#ffffff';
            // add text-shadow
            context.shadowColor = '#000000';
            context.shadowBlur = 5;
            context.shadowOffsetX = 2;
            context.shadowOffsetY = 2;
            context.fillText(`#${rank}`, x, y);
            const textWidth = context.measureText(`#${rank}`).width;
            context.font = 'bold 24px Open Sans';
            context.fillStyle = '#cccccc';
            context.fillText(translate('rank'), x - textWidth - 8, y);
            context.restore();
        };

        const drawXP = (xp, next_level, x, y) => {
            context.save();
            const first = nFormatter(xp, 2)
            const second = ` / ${nFormatter(next_level, 2)} XP`;
            context.textAlign = 'right';
            context.font = 'bold 24px Open Sans';
            context.fillStyle = '#cccccc';
            // add text-shadow
            context.shadowColor = '#000000';
            context.shadowBlur = 10;
            context.shadowOffsetX = 2;
            context.shadowOffsetY = 2;
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

            // create clipping mask for progress
            context.beginPath();
            context.roundRect(x, y, width, height, 20);
            context.clip();

            context.beginPath();
            context.fillStyle = '#9999ff';
            context.roundRect(x, y, width * (current / max), height, 20);
            context.fill();
            context.restore();
        };

        const drawAvatar = (avatar, x, y, width, height) => {
            context.save();
            context.beginPath();
            context.arc(x + width / 2, y + height / 2, width / 2, 0, Math.PI * 2, true);
            context.closePath();
            context.strokeStyle = '#ffffff';
            context.lineWidth = 3;
            context.stroke();
            context.clip();
            context.drawImage(avatar, x, y, width, height);
            context.restore();
        };

        drawAvatar(avatar, 36, 36, 128, 128);
        drawName(user, 180, 110);
        drawXP(row.xp, xpToNextLevel, canvas.width - 32, 110);
        const offset = drawLevel(level, canvas.width - 32, 64);
        drawRank(rank, canvas.width - 48 - offset, 64);
        drawProgressBar(xpInLevel, xpForLevel, 180, 130, canvas.width - 216, 24);

        const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'card.png' });
        callback({ type: 'attachment', content: attachment });
    }
}