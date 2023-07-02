const express = require('express');
const config = require('../../config');

const runDatabaseMethod = async (database, method, ...args) => {
    if (!database[method])
        return null;
    const result = await database[method](...args);
    if (result === null || result === undefined) {
        return {}; // Return empty object
    }
    return result;
}

module.exports = (logger, client, database) => {
    const router = express.Router();

    // Check if key is valid
    router.use((req, res, next) => {
        if (!req.query.key || req.query.key !== config.web.secret) {
            return res.status(401).send("Unauthorized");
        }
        next();
    });

    router.get('/:method', async (req, res) => {
        const method = req.params.method;
        const result = await runDatabaseMethod(database, method);
        res.json(result);
    });

    router.get('/:method/:props*', async (req, res) => {
        const method = req.params.method;
        const props = req.params.props.split('/');
        const result = await runDatabaseMethod(database, method, ...props);
        res.json(result);
    });

    router.post('/:method', async (req, res) => {
        const method = req.params.method;
        const body = req.body;
        const result = await runDatabaseMethod(database, method, body);
        res.json(result);
    });

    return router;
}