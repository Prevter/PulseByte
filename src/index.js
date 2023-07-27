const config = require('../config');
const logger = new (require('./logger'))(config.logger);
process.logger = logger;
logger.clearFile();

// Express dependencies
const express = require('express');
const cors = require('cors')
const port = config.web.port || 80;
const bodyParser = require('body-parser');

// Database
const con_string = config.database.connection_string;
const db_context = require(`./database/${config.database.type}`)
const database = new db_context(con_string, logger);

// Database backup
if (config.database.enable_backup) {
    const fs = require('fs');
    const path = require('path');

    const doBackup = async () => {
        const db_export = await database.export();
        let files = {};
        for (const key in db_export) {
            const data = JSON.stringify(db_export[key], null, 4);
            files[`${key}.bak`] = data;
        }

        if (!fs.existsSync(config.database.backup_path))
            fs.mkdirSync(config.database.backup_path);

        const date_str = new Date().toISOString()
            .replace(/\//g, '-')
            .replace(/T/g, '_')
            .replace(/:/g, '-')
            .split('.')[0];
        const backup_dir = path.join(config.database.backup_path, date_str);
        fs.mkdirSync(backup_dir);

        // Write files
        for (const filename in files) {
            fs.writeFile(`${backup_dir}/${filename}`, files[filename], (err) => {
                if (err) {
                    logger.error('Backup', `Failed to export ${filename} to ${backup_dir}`, err);
                    return;
                }

            });
        }

        logger.info('Backup', `💾 Saved backup in '${date_str}'`);

        fs.readdir(config.database.backup_path, (err, files) => {
            files.sort((a, b) => {
                // get date from folder name
                // format: YYYY-MM-DD_HH-MM-SS
                // newest should be first
                const date_a = a.split('_')[0].split('-');
                const time_a = a.split('_')[1].split('-');
                const date_b = b.split('_')[0].split('-');
                const time_b = b.split('_')[1].split('-');

                const date_a_obj = new Date(date_a[0], date_a[1], date_a[2], time_a[0], time_a[1], time_a[2]);
                const date_b_obj = new Date(date_b[0], date_b[1], date_b[2], time_b[0], time_b[1], time_b[2]);

                return date_b_obj - date_a_obj;
            });

            for (let i = config.database.backup_count; i < files.length; i++) {
                const file = files[i];
                fs.rm(`${config.database.backup_path}/${file}`, { recursive: true }, (err) => {
                    if (err) {
                        logger.error('Backup', `Failed to delete ${file}`, err);
                        return;
                    }
                });
            }
        });
    };

    setInterval(doBackup, config.database.backup_interval);
    if (config.database.backup_on_start) doBackup();
}

// Discord
const DiscordClient = require('./client');
const client = new DiscordClient(config.bot.token, database, logger);
process.client = client;
client.init();

client.once('ready', () => {
    reloadExpress();
});

// Express
var reloadExpress = () => { };

if (config.web.enabled) {
    let expressApp = null;

    reloadExpress = () => {
        if (expressApp) {
            logger.info('Website', '🚀 Reloading website');
            expressApp.close();
            expressApp = null;
        }

        const app = express();
        app.use(bodyParser.urlencoded({ extended: true }));
        app.use(bodyParser.json());
        app.use(cors());

        if (require.cache[require.resolve('./website')]) {
            delete require.cache[require.resolve('./website')];
        }

        const router = require('./website')(logger, client, database);

        app.use(express.static('./src/website/public'));
        app.use('/', router);

        expressApp = app.listen(port, () => {
            logger.info('Website', `🚀 Server listening on port ${port}`);
        });
    }

}

process.reloadExpress = reloadExpress;

client.login();

// Exit handlers and error handlers
process.on('exit', () => database.close());
process.on('SIGHUP', () => process.exit(128 + 1));
process.on('SIGINT', () => process.exit(128 + 2));
process.on('SIGTERM', () => process.exit(128 + 15));
process.on('uncaughtException', function (err) {
    logger.error('Uncaught', err.stack);
});