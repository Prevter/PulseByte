const express = require('express');
const ejs = require('ejs');
const config = require('../../config');
require('../utils');
const XPModule = require("../modules/xp");
const os = require('os');

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

const getStatus = (client) => {
    const daysParser = (days, locale) => {
        if (days % 10 === 1 && days % 100 !== 11)
            return locale('!status.day.one');
        else if (days % 10 >= 2 && days % 10 <= 4 && (days % 100 < 10 || days % 100 >= 20))
            return locale('!status.day.few') ?? locale('!status.day.other');
        else
            return locale('!status.day.other');
    }

    const timeString = (timePassed, locale) => {
        let seconds = Math.floor(timePassed % 60);
        let minutes = Math.floor(timePassed / 60) % 60;
        let hours = Math.floor(timePassed / 3600) % 24;
        let days = Math.floor(timePassed / 86400);
        let result = '';
        if (days > 0)
            result += `${days} ${daysParser(days, locale)} `;
        if (hours > 0 || result.length > 0)
            result += `${hours}:`;
        if (minutes > 0 || result.length > 0)
            result += `${minutes < 10 ? '0' : ''}${minutes}:`;
        else
            result += `${minutes}:`;
        result += `${seconds < 10 ? '0' : ''}${seconds}`;
        return result;
    }

    const serverCount = client.client.guilds.cache.size;
    const ping = client.client.ws.ping;
    const uptime = client.client.uptime;
    const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;
    const nodeVersion = process.version;
    const osName = (() => {
        switch (os.platform()) {
            case 'aix': return 'AIX';
            case 'darwin': return 'macOS';
            case 'freebsd': return 'FreeBSD';
            case 'linux': return 'Linux';
            case 'openbsd': return 'OpenBSD';
            case 'sunos': return 'SunOS';
            case 'win32': return 'Windows';
            case 'android': return 'Android';
            default: return os.platform();
        }
    })();
    const osVersion = os.release();
    const totalMemory = os.totalmem() / 1024 / 1024 / 1024;
    const freeMemory = os.freemem() / 1024 / 1024 / 1024;
    return {
        serverCount,
        ping,
        uptime: timeString(uptime / 1000, client.locale),
        memoryUsage: memoryUsage.toFixed(2),
        nodeVersion,
        osName,
        osVersion,
        totalMemory: totalMemory.toFixed(2),
        usedMemory: (totalMemory - freeMemory).toFixed(2),
        voiceConnections: client.client.distube.voices.size
    }
}

module.exports = (logger, client, database) => {
    const router = express.Router();

    let main_page;
    ejs.renderFile(`${__dirname}/components/main_page.ejs`, { client, config }, {}, function (err, str) {
        if (err) {
            logger.error('Website', err);
            return;
        }

        main_page = str;
    });

    const renderPage = (main, page, options) => {
        return new Promise((resolve, reject) => {
            ejs.renderFile(`${__dirname}/pages/${page}.ejs`, options, {}, function (err, str) {
                if (err) {
                    logger.error('Website', err);
                    return reject("An error occurred while rendering the page.");
                }

                resolve(main.replace("%%_content_%%", str));
            });
        });
    }

    router.get('/', async (req, res, next) => {
        const stats = await database.getStats();
        stats.servers = client.client.guilds.cache.size;
        stats.users = client.client.users.cache.size;

        try {
            const page = await renderPage(main_page, "index", { client, config, stats });
            res.send(page);
        }
        catch (err) {
            next({ status: 500, message: err });
        }
    });

    router.get('/invite', (req, res) => {
        res.redirect(`https://discord.com/oauth2/authorize?client_id=${client.client.user.id}&scope=bot&permissions=8`);
    });

    router.get('/status/json', async (req, res, next) => {
        const status = getStatus(client);

        try {
            res.json(status);
        }
        catch (err) {
            next({ status: 500, message: err });
        }
    });

    router.get('/status', async (req, res, next) => {
        const status = getStatus(client);

        try {
            const page = await renderPage(main_page, "status", { status });
            res.send(page);
        }
        catch (err) {
            next({ status: 500, message: err });
        }
    });

    router.get('/docs', async (req, res, next) => {
        const commands = client.commands;
        const categories = {};
        for (const command of commands) {
            if (!categories[command.category]) {
                categories[command.category] = [];
            }

            categories[command.category].push(command);
        }

        try {
            const page = await renderPage(main_page, "docs", { client, config, categories });
            res.send(page);
        }
        catch (err) {
            next({ status: 500, message: err });
        }
    });

    router.get('/leaderboard/:server_id', async (req, res, next) => {
        const server_id = req.params.server_id;
        const ratings = await database.getUsers(server_id);

        // If the server doesn't exist, return 404
        if (!ratings.length) {
            return next({ status: 404, message: "Server you're trying to access is not available." });
        }

        const guild = client.client.guilds.cache.get(server_id);
        const guild_icon = guild.iconURL({ dynamic: true, size: 4096 });

        const data = [];
        let place = 0;
        for (const rating of ratings) {
            place++;
            let member = null;
            try {
                member = await guild.members.fetch(rating.id);
            }
            catch (err) { /* empty */ }
            if (!member) {
                // try to fetch from cache
                const user = client.client.users.cache.get(rating.id);
                if (!user) {
                    continue;
                }
                member = { user };
            }

            if (!member) {
                member = { user: { tag: rating.id, displayAvatarURL: () => "https://cdn.discordapp.com/embed/avatars/0.png" } }
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
                nickname: member.nickname,
                avatar: member.user.displayAvatarURL({ dynamic: true, size: 256 }),
                xp: rating.xp,
                level: XPModule.getLevel(rating.xp),
                messages: rating.message_count,
                progress: Math.round((xpInLevel / xpForLevel) * 100)
            });
        }

        try {
            const page = await renderPage(main_page, "leaderboard", { client, config, data, guild, guild_icon, nFormatter });
            res.send(page);
        }
        catch (err) {
            next({ status: 500, message: err });
        }
    });

    // 404 handler
    router.use((req, res, next) => {
        next({ status: 404, message: "Page you are looking for does not exist." });
    });

    // Error handler
    router.use(async (err, req, res, next) => {
        try {
            const page = await renderPage(main_page, "error", { client, config, err });
            res.status(err.status || 500);
            res.send(page);
        }
        catch (err) {
            res.status(500).send("An error occurred while rendering the page.");
        }
    });

    return router;
}