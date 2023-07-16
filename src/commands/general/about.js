const Command = require("../../types/command");

module.exports = class extends Command {
    constructor(client, database) {
        super(client, database, {
            name: 'about',
            aliases: ['info'],
            category: 'general'
        });
    }

    async run(message, locale, args) {
        let invite = `https://discord.com/oauth2/authorize?client_id=${this.discord.user.id}&scope=bot&permissions=8`;
        let fields = [];

        if (this.config.bot.about.repo) fields.push({
            name: locale('about.repo'),
            value: locale('about.repo_value', this.config.name, this.config.bot.about.repo),
            inline: true
        });

        if (this.config.bot.about.support) fields.push({
            name: locale('about.support'),
            value: locale('about.support_value', this.config.name, this.config.bot.about.support),
            inline: true
        });


        message.reply({
            embeds: [Command.createEmbed({
                title: this.config.name,
                description: locale('about.description', invite),
                fields,
                url: this.config.web.url,
                thumbnail: this.discord.user.avatarURL()
            })]
        });
    }
}