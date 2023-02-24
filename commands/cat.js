const { Translator } = require('../common/utils');
const { EmbedBuilder } = require('discord.js');
const { dir } = require('console');
const request = require('request');

const translations = {
    en: {
        desc: "Get a random cat image",
        args: {
            tag: "Image tag (ex. gif, cute, etc.)",
            text: "Text to put on the image"
        },
    },
    uk: {
        desc: "Отримати випадкове фото кота",
        args: {
            tag: "Тег фото (наприклад gif, cute, і т.д.)",
            text: "Текст, що буде на фото"
        },
    },
};

module.exports = {
    name: "cat",
    category: "fun",
    aliases: ["кіт"],
    arguments: [
        {
            name: "tag",
            type: "string"
        },
        {
            name: "text",
            type: "string"
        }
    ],
    translations: translations,
    customPrefixArgs: true,
    run: async (args, db, locale, callback, meta) => {
        let translate = new Translator(translations, locale);

        if (meta.type === 'prefix') {
            // parse args from array
            // example: 
            // ['cat', '-tag', 'gif', '-text', 'hello world']
            // will be parsed to:
            // { tag: 'gif', text: 'hello world' }

            let parsedArgs = {};
            let currentArg = null;
            for (let i = 1; i < args.length; i++) {
                if (args[i].startsWith('-')) {
                    currentArg = args[i].replace('-', '');
                    parsedArgs[currentArg] = '';
                } else {
                    parsedArgs[currentArg] += args[i];
                }
            }

            args = parsedArgs;
        }

        let url = `https://cataas.com/cat`;

        if (args.tag) {
            url += `/${args.tag}`;
        }
        if (args.text) {
            url += `/says/${args.text}`;
        }

        // load image from this url
        const https = require("https");

        let directUrl = null;
        https.get(url + '?json=true', (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                let json = JSON.parse(data);
                if (json.url) {
                    directUrl = `https://cataas.com${json.url}`;

                    let embed = new EmbedBuilder()
                        .setColor(0x0099FF)
                        .setImage(directUrl);

                    callback({ type: 'embed', content: embed });
                }
            });
        }).on("error", (err) => {
            console.log("Error: " + err.message);
        });
    }
}