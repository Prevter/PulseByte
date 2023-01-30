const { EmbedBuilder } = require('discord.js');
const { Translator } = require('../common/utils');

const translations = {
    en: {
        desc: "Create an embed and send it",
        args: {
            json: "Embed JSON code",
        },
        noEmbed: "Please specify json",
    },
    uk: {
        desc: "Створити ембед та відправити його",
        args: {
            json: "JSON код ембеда",
        },
        noEmbed: "Будь-ласка вкажіть json",
    },
};

module.exports = {
    name: "embed",
    category: "utils",    
    aliases: ["ембед"],
    arguments: [
        {
            name: "json",
            type: "string",
            isRequired: true,
            longString: true,
        }
    ],
    translations: translations,
    run: async (args, db, locale, callback, meta) => {
        let translate = new Translator(translations, locale);

        if (!args.json) {
            callback({ type: 'text', content: translate('noEmbed') })
            return;
        }

        if (args.json.startsWith('```json'))
            args.json = args.json.substring(7);
        if (args.json.startsWith('```'))
            args.json = args.json.substring(3);
        if (args.json.endsWith('```'))
            args.json = args.json.substring(0, args.json.length - 3);

        try {
            let json = JSON.parse(args.json);
            let embed = new EmbedBuilder();

            if (json.color) embed.setColor(json.color);
            if (json.title) embed.setTitle(json.title);
            if (json.url) embed.setURL(json.url);
            if (json.description) embed.setDescription(json.description);
            if (json.author) embed.setAuthor(json.author);
            if (json.footer) embed.setFooter(json.footer);
            if (json.thumbnail) embed.setThumbnail(json.thumbnail);
            if (json.image) embed.setImage(json.image);
            if (json.fields) {
                for (let field of json.fields) {
                    embed.addFields(field);
                }
            }
            callback({ type: 'embed', content: embed, reply: false });
            // delete sent message
            meta.message.delete();
        }
        catch (e) {
            callback({ type: 'text', content: `\`\`\`${e}\`\`\`` });
        }
    }
}