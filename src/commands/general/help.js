const Command = require("../../types/command");
const config = require('../../../config.json');
const fs = require('fs');

module.exports = class extends Command {
    constructor(client, database) {
        const _categories = [];
        fs.readdirSync('./src/commands/', { withFileTypes: true }).forEach(file => {
            if (file.isDirectory()) {
                _categories.push(file.name);
            }
        });

        const categories = _categories.map(value => ({
            name: client.locale(`help.${value}`) ?? value,
            value
        })).filter(c => c.name !== 'owner');

        super(client, database, {
            name: 'help',
            aliases: ['h'],
            category: 'general',
            args: [{
                name: 'category',
                type: 'choice',
                choices: categories
            },
            {
                name: 'command',
                type: 'string'
            }]
        });
    }

    /**
     * Get all categories available
     * @param {(key:string, ...args) => string} locale Locale function
     * @returns {Object} Categories
     */
    getCategories(locale) {
        const categories = {};
        this.client.commands.forEach(command => {
            if (command.hidden) return;
            const category = command.category;
            const categoryLocale = locale(`help.${category}`);
            categories[category] = categoryLocale;
        });
        return categories;
    }

    async runAsSlash(interaction, locale, args) {
        const categories = this.getCategories(locale);

        if (args.category) {
            const category = categories[args.category];
            let fields = [];
            this.client.commands.forEach(command => {
                if (command.category !== args.category) return;
                if (command.hidden) return;
                const usage = locale(`${command.name}._usage`);

                fields.push({
                    name: `</${command.name}:${command._id}>${usage ? ` \`${usage}\`` : ''}`,
                    value: locale(`${command.name}._description`) ?? locale('global.no_description')
                });
            });

            const embed = Command.createEmbed({
                title: category ?? args.category,
                description: locale(`help.${args.category}_desc`) ?? locale('global.no_description'),
                fields
            });

            interaction.reply({ embeds: [embed] });
            return;
        }

        if (args.command) {
            const command = this.client.commands.find(c => c.name == args.command || (c.aliases && c.aliases.includes(args.command)));
            if (!command || command.hidden) {
                interaction.reply({ content: locale('help.not_found', ''), ephemeral: true });
                return;
            }

            const embed = Command.createEmbed({
                title: locale('help.command', command.name),
                description: locale(`${command.name}._description`) ?? locale('global.no_description'),
                fields: [
                    ...command.args.map(arg => ({
                        name: arg.name,
                        value: locale(`${command.name}._args_desc.${arg.name}`) ?? locale('global.no_description'),
                        inline: true
                    })),
                    {
                        name: locale('help.aliases'),
                        value: command.aliases.length ? command.aliases.map(a => `\`${a}\``).join(', ') : locale('global.none')
                    },
                    {
                        name: locale('help.category'),
                        value: locale(`help.${command.category}`) ?? command.category
                    }
                ]
            });

            interaction.reply({ embeds: [embed] });
            return;
        }

        let fields = [];
        for (const [category, categoryLocale] of Object.entries(categories)) {
            fields.push({
                name: categoryLocale ?? category,
                value: `</help:${this._id}> \`${category}\``,
                inline: true
            });
        }

        const embed = Command.createEmbed({
            title: locale('help.categories'),
            thumbnail: this.discord.user.displayAvatarURL(),
            fields
        });

        interaction.reply({ embeds: [embed] });
    }

    async run(message, locale, args) {
        let prefix = config.bot.prefix;
        if (message.guild_data)
            prefix = message.guild_data.prefix;

        // if no args, show all categories
        const categories = this.getCategories(locale);


        if (args.length === 0) {
            let fields = [];
            for (const [category, categoryLocale] of Object.entries(categories)) {
                fields.push({
                    name: categoryLocale ?? category,
                    value: `\`${prefix}help ${category}\``,
                    inline: true
                });
            }

            const embed = Command.createEmbed({
                title: locale('help.categories'),
                thumbnail: this.discord.user.displayAvatarURL(),
                fields
            });

            message.reply({ embeds: [embed] });
            return;
        }

        const arg = args[0].toLowerCase();
        const command = this.client.commands.find(c => c.name == arg || (c.aliases && c.aliases.includes(arg)));
        if (command && !command.hidden) {
            const usage = locale(`${command.name}._usage`);
            const embed = Command.createEmbed({
                title: locale('help.command', command.name),
                description: locale(`${command.name}._description`) ?? locale('global.no_description'),
                fields: [
                    ...command.args.map(arg => ({
                        name: `${arg.name}${arg.required ? '*' : ''}`,
                        value: locale(`${command.name}._args_desc.${arg.name}`) ?? locale('global.no_description'),
                        inline: true
                    })),
                    {
                        name: locale('help.usage'),
                        value: `\`${prefix}${command.name}${usage ? ` ${usage}` : ''}\``
                    },
                    {
                        name: locale('help.aliases'),
                        value: command.aliases.length ? command.aliases.map(a => `\`${a}\``).join(', ') : locale('global.none')
                    },
                    {
                        name: locale('help.category'),
                        value: locale(`help.${command.category}`) ?? command.category
                    }
                ]
            });

            message.reply({ embeds: [embed] });
            return;
        }

        const category = categories[arg];
        if (category !== undefined) {
            let fields = [];
            this.client.commands.forEach(command => {
                if (command.hidden) return;
                if (command.category !== arg) return;
                const usage = locale(`${command.name}._usage`);

                fields.push({
                    name: `\`${prefix}${command.name}${usage ? ` ${usage}` : ''}\``,
                    value: locale(`${command.name}._description`) ?? locale('global.no_description'),
                });
            });

            const embed = Command.createEmbed({
                title: category ?? arg,
                description: locale(`help.${arg}_desc`) ?? locale('global.no_description'),
                fields
            });

            message.reply({ embeds: [embed] });
            return;
        }

        message.reply(locale('help.not_found', arg));
    }
}