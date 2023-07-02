const express = require('express');
const ejs = require('ejs');
const config = require('../../config');

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

    return router;
}