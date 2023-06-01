const config = require('../config');
const logger = new (require('./logger'))(config.logger.level, config.logger.file, config.logger.options);
process.logger = logger;
logger.clearFile();

// Express dependencies
const express = require('express');
const cors = require('cors')
const app = express();
const port = config.web.port || 80;

// Parse request body
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

// Database
const con_string = config.database.connection_string;
const db_context = require(`./database/${config.database.type}`)
const database = new db_context(con_string, logger);

// Discord
const { Events, ActivityType } = require('discord.js');
const { messageHandler, slashCommandHandler } = require('./handlers');
const DiscordClient = require('./client');
const client = new DiscordClient(config.bot.token, database, logger);
client.init();

// Handlers
client.once(Events.ClientReady, c => {
    logger.info(`✅ Ready! Logged in as ${c.user.id}`);

    c.user.setActivity({
        name: config.bot.activity.name,
        type: ActivityType[config.bot.activity.type]
    });

    client.registerCommands();
});

client.on("messageCreate", (msg) => messageHandler(client, msg));
client.on("interactionCreate", (int) => slashCommandHandler(client, int));
client.on("interactionCreate", (int) => {
    // TODO: make button, modal, select menu handler
});

client.login();

// Express
const router = require('./website')(logger, client, database);
app.use('/', router);
app.use(express.static('./src/website/public'));

app.listen(port, () => {
    logger.info(`🚀 Server listening on port ${port}`);
});

// Exit handlers and error handlers
process.on('exit', () => database.close());
process.on('SIGHUP', () => process.exit(128 + 1));
process.on('SIGINT', () => process.exit(128 + 2));
process.on('SIGTERM', () => process.exit(128 + 15));
process.on('uncaughtException', function (err) {
    logger.error('Uncaught', err.stack);
});