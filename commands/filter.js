const { Translator } = require('../common/utils');

const translations = {
    en: {
        desc: "Add effect to the song",
        args: {
            filter: "Filter name"
        },
        nothingPlaying: "❌ Queue is empty",
        turnedOn: "✅ {0} turned on",
        turnedOff: "🟥 {0} turned off",
        effects: {
            "3d": ["3d"],
            "bassboost": ["bassboost", "bass", "bb"],
            "echo": ["echo"],
            "karaoke": ["karaoke"],
            "nightcore": ["nightcore", "nc"],
            "vaporwave": ["vaporwave", "vapor", "vw"],
            "flanger": ["flanger"],
            "gate": ["gate"],
            "haas": ["haas"],
            "reverse": ["reverse"],
            "surround": ["surround", "surrounding"],
            "mcompand": ["mcompand"],
            "phaser": ["phaser"],
            "tremolo": ["tremolo"],
            "earwax": ["earwax"],
        },
        help: ["list", "help"],
        notFound: "❌ Filter not found",
    },
    uk: {
        desc: "Додати ефект до пісні",
        args: {
            filter: "Назва фільтра"
        },
        nothingPlaying: "❌ Черга порожня",
        turnedOn: "✅ {0} включено",
        turnedOff: "🟥 {0} вимкнено",
        effects: {
            "3d": ["3д"],
            "bassboost": ["басбуст", "бас", "бб"],
            "echo": ["ехо"],
            "karaoke": ["караоке"],
            "nightcore": ["найткор", "нк"],
            "vaporwave": ["вейпорвейв", "вейпор", "вв"],
            "flanger": ["флангер"],
            "gate": ["гейт"],
            "haas": ["хаас"],
            "reverse": ["реверс"],
            "surround": ["серраунд", "серраундинг", "серраундінг", "сурраунд", "сурраундинг", "сурраундінг"],
            "mcompand": ["мкомпанд"],
            "phaser": ["фейзер", "фазер"],
            "tremolo": ["тремоло"],
            "earwax": ["вухоотек", "еарвакс"],
        },
        help: ["ліст", "хелп", "список", "допомога"],
        notFound: "❌ Фільтр не знайдено",
    },
};

module.exports = {
    name: "filter",
    category: "music",
    aliases: ["фільтр", "філтер", "ефект", "effect"],
    arguments: [
        {
            name: "filter",
            type: "string",
            required: true
        }
    ],
    translations: translations,
    guildOnly: true,
    run: async (args, db, locale, callback, meta) => {
        let translate = new Translator(translations, locale);
        
        const createList = () => {
            let list = [];
            const effects = translate('effects');
            for (const [key, value] of Object.entries(effects)) {
                list.push(`${key}: ${value.join(', ')}`);
            }
            return callback({ type: 'text', content: '```' + list.join('\n') + '```'});
        }

        if (!args.filter)
            return createList();

        let filter = args.filter.toLowerCase();
        let filterName = null;
        for (const translation of Object.values(translations)) {
            for (const value of translation.help) {
                if (value === filter) {
                    return createList();
                }
            }

            for (const [key, value] of Object.entries(translation.effects)) {
                if (value.includes(filter)) {
                    filterName = key;
                    break;
                }
            }
            if (filterName) break;
        }

        if (!filterName) 
            return callback({ type: 'text', content: translate('notFound') });
        
        const queue = meta.client.distube.getQueue(meta.message)
        if (!queue) return callback({ type: 'text', content: translate('nothingPlaying') });
        
        if (queue.filters.has(filterName)) {
            queue.filters.remove(filterName);
            callback({ type: 'text', content: translate('turnedOff', filterName) });
        } else {
            queue.filters.add(filterName);
            callback({ type: 'text', content: translate('turnedOn', filterName) });
        }
    }
}