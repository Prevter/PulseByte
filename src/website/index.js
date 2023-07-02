const express = require('express');
const ejs = require('ejs');
const config = require('../../config');
require('../utils');
const XPModule = require("../modules/xp");

const nFormatter = (num, digits) => {
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

module.exports = (logger, client, database) => {
    const router = express.Router();

    router.get('/', async (req, res) => {
        const stats = await database.getStats();
        stats.servers = client.client.guilds.cache.size;
        stats.users = client.client.users.cache.size;

        ejs.renderFile("./src/website/pages/index.ejs", { client, config, stats }, {}, function (err, str) {
            if (err) {
                logger.error('Website', err);
                return res.send("An error occurred while rendering the page.");
            }

            res.send(str);
        });
    });

    router.get('/invite', (req, res) => {
        res.redirect(`https://discord.com/oauth2/authorize?client_id=${client.client.user.id}&scope=bot&permissions=8`);
    });

    router.get('/leaderboard/:server_id', async (req, res) => {
        const server_id = req.params.server_id;
        const ratings = await database.getUsers(server_id);
        const guild = client.client.guilds.cache.get(server_id);
        const guild_icon = guild.iconURL({ dynamic: true, size: 4096 });

        const data = [];
        let place = 0;
        for (const rating of ratings) {
            place++;
            let member = await guild.members.fetch(rating.id);
            if (!member) {
                // try to fetch from cache
                const user = client.client.users.cache.get(rating.id);
                if (!user) {
                    continue;
                }
                member = { user };
            }

            const level = XPModule.getLevel(rating.xp);
            const xpToPrevLevel = XPModule.getLevelXp(level);
            const xpToNextLevel = XPModule.getLevelXp(level + 1);
            const xpInLevel = rating.xp - xpToPrevLevel;
            const xpForLevel = xpToNextLevel - xpToPrevLevel;

            data.push({
                user_id: rating.id,
                place: place,
                tag: member.user.tag.stripTag(),
                avatar: member.user.displayAvatarURL({ dynamic: true, size: 256 }),
                xp: rating.xp,
                level: XPModule.getLevel(rating.xp),
                messages: rating.message_count,
                progress: Math.round((xpInLevel / xpForLevel) * 100)
            });
        }

        ejs.renderFile("./src/website/pages/leaderboard.ejs", { client, config, data, guild, guild_icon, nFormatter }, {}, function (err, str) {
            if (err) {
                logger.error('Website', err);
                return res.send("An error occurred while rendering the page.");
            }

            res.send(str);
        });
    });

    return router;
}