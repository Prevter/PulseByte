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
        // Clear locale cache
        let locales = [];
        fs.readdirSync('./src/locales').forEach(file => {
            if (file.endsWith('.json')) {
                locales.push(file);
            }
        });

        for (const locale of locales) {
            delete require.cache[require.resolve(`../../locales/${locale}`)];
        }

        this.client.reloadCommands();
        await this.client.registerCommands();
        message.react('✅');
    }
}