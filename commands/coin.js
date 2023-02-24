const { Translator } = require('../common/utils');

const coinEmojis = {
    heads: "<:heads:1077889178672578560>",
    tails: "<:tails:1077889180199288832>",
}

const translations = {
    en: {
        desc: "Flip a coin",
        args: {},
        tails: "Tails",
        heads: "Heads"
    },
    uk: {
        desc: "Підкинути монетку",
        args: {},
        tails: "Орел",
        heads: "Решка"
    },
};

module.exports = {
    name: "coin",
    category: "fun",
    aliases: ["flip", "toss", "монетка", "коін", "койн", "тосс", "фліп", "монета"],
    arguments: [],
    translations: translations,
    run: async (args, db, locale, callback, meta) => {
        let translate = new Translator(translations, locale);
        const coin = Math.random() > 0.5 ? "heads" : "tails";
        callback({ type: 'text', content: `${coinEmojis[coin]} ${translate(coin)}` });
    }
}