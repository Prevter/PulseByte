const Command = require("../../types/command");

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
        this.client.reloadCommands();
        await this.client.registerCommands();
        message.react('✅');
    }
}