const Command = require("../../types/command");

module.exports = class extends Command {
    constructor(client, database) {
        super(client, database, {
            name: 'invite',
            aliases: ['inv', 'link'],
            category: 'general'
        });
    }

    async run(message, locale, args) {
        let invite = `https://discord.com/oauth2/authorize?client_id=${this.discord.user.id}&scope=bot&permissions=8`;
        message.reply(locale('invite.message', invite));
    }
}