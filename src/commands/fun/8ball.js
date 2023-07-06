const Command = require("../../types/command");

const heads_emoji = '<:heads:1078314870925185135>';
const tails_emoji = '<:tails:1078314873982824519>';

module.exports = class extends Command {
    constructor(client, database) {
        super(client, database, {
            name: '8ball',
            aliases: ['ball', 'magic', '8b', '8'],
            category: 'fun'
        });
    }

    async run(message, locale, args) {
        const lines = locale('8ball.lines');
        const line = lines[Math.floor(Math.random() * lines.length)];
        let embed = Command.createEmbed({
            description: `🎱 ${line}`
        });
        message.reply({ embeds: [embed] });
    }
}