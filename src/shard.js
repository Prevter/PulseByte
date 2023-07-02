const DiscordClient = require('./client');
const config = require('../config');
const logger = new (require('./logger'))(config.logger);
const axios = require('axios');

class ApiDatabase {
    constructor() {
        return new Proxy(this, {
            get(target, prop) {
                return async (...args) => {
                    return target._execute(prop, ...args);
                };
            },
        });
    }

    async _execute(method_name, ...args) {
        let url = `http://localhost:${config.web.port}/api/${method_name}`;
        let body = null;
        // iterate through args and append to url as path
        for (let i = 0; i < args.length; i++) {
            if (typeof(args[i]) === 'object') {
                body = args[i]; 
            } else {
                url += `/${args[i]}`;
            }
        }

        // add secret key
        url += `?key=${config.web.secret}`;

        // if body is null, then it's a GET request
        if (body === null) {
            return await axios.get(url).then((res) => res.data);
        }

        // otherwise, it's a POST request
        return await axios.post(url, body).then((res) => res.data);
    }
}

const database = new ApiDatabase();
const client = new DiscordClient(config.bot.token, database, logger);

client.init();

client.login().then((result) => {
    logger.info(`Cluster #${client.client.cluster.id}`, `✅ Logged in!`);
}).catch((err) => {
    logger.error(`Cluster #${client.client.cluster.id}`, `💎 Shard login error: ${err}`);
});

// Exit handlers and error handlers
process.on('exit', () => database.close());
process.on('SIGHUP', () => process.exit(128 + 1));
process.on('SIGINT', () => process.exit(128 + 2));
process.on('SIGTERM', () => process.exit(128 + 15));
process.on('uncaughtException', function (err) {
    logger.error('Uncaught', err.stack);
});