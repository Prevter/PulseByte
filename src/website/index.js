const express = require('express');
const ejs = require('ejs');

module.exports = (logger, client, database) => {
    const router = express.Router();

    router.get('/', (req, res) => {
        ejs.renderFile("./src/website/pages/index.ejs", { client }, {}, function (err, str) {
            if (err) {
                logger.error(err);
                return res.send("An error occurred while rendering the page.");
            }
            
            res.send(str);
        });
    });

    return router;
}