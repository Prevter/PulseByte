const Command = require("../../types/command");
const fs = require('fs');

module.exports = class extends Command {
    constructor(client, database) {
        super(client, database, {
            name: 'reload',
            aliases: ['restart'],
            category: 'owner',
            owner_only: true,
            hidden: true
        });
    }

    async run(message, locale, args) {
        if (!args[0]) args[0] = 'commands';

        const all = args.includes('all');
        const commands = args.includes('commands') || all;
        const locales = args.includes('locales') || all;
        const handlers = args.includes('handlers') || all;
        const slash = args.includes('slash') || all;

        if (locales) {
            // Clear locale cache
            fs.readdirSync('./src/locales').forEach(file => {
                if (file.endsWith('.json')) {
                    delete require.cache[require.resolve(`../../locales/${file}`)];
                }
            });
            this.logger.info('Reload', '✅ Reloaded locales');
        }

        if (handlers) {
            // Reload handlers
            this.client.loadHandlers();
            this.logger.info('Reload', '✅ Reloaded handlers');
        }

        if (commands) {
            // Refresh commands and modules
            this.client.reloadCommands();
            this.logger.info('Reload', '✅ Reloaded commands');
        }

        if (slash) {
            // Register slash commands
            await this.client.registerCommands();
        }

        message.react('✅');
    }
}