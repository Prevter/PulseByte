const Command = require("../../types/command");

const heads_emoji = '<:heads:1078314870925185135>';
const tails_emoji = '<:tails:1078314873982824519>';

module.exports = class extends Command {
    constructor(client, database) {
        super(client, database, {
            name: 'coin',
            aliases: ['flip', 'coinflip'],
            category: 'fun'
        });
    }

    async run(message, locale, args) {
        let result = Math.floor(Math.random() * 2) === 0;
        let embed = Command.createEmbed({
            description: locale(result ? 'coin.heads' : 'coin.tails', result ? heads_emoji : tails_emoji)
        });
        message.reply({ embeds: [embed] });
    }
}