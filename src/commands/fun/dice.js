const Command = require("../../types/command");

const heads_emoji = '<:heads:1078314870925185135>';
const tails_emoji = '<:tails:1078314873982824519>';

module.exports = class extends Command {
    constructor(client, database) {
        super(client, database, {
            name: 'dice',
            aliases: ['cube', 'roll', 'diceroll', 'random'],
            category: 'fun',
            args: [{
                name: 'max',
                type: 'integer'
            },
            {
                name: 'min',
                type: 'integer'
            }]
        });
    }

    async runAsSlash(interaction, locale, args) {
        if (args.min && args.max) {
            return await this.run(interaction, locale, [args.min, args.max]);
        }
        else if (args.max) {
            return await this.run(interaction, locale, [args.max]);
        }
        else {
            return await this.run(interaction, locale, []);
        }
    }

    async run(message, locale, args) {
        let max = 6;
        let min = 1;

        if (args.length === 1) {
            max = parseInt(args[0]);
        }
        else if (args.length === 2) {
            min = parseInt(args[0]);
            max = parseInt(args[1]);
        }

        if (isNaN(max) || isNaN(min) || max < min) {
            return await message.reply({ embeds: [Command.createErrorEmbed(locale('dice.invalid_range'))] });
        }

        let result = Math.floor(Math.random() * (max - min + 1)) + min;
        let embed = Command.createEmbed({
            description: locale('dice.result', result)
        });
        message.reply({ embeds: [embed] });
    }
}