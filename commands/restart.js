const createEmbed = require('../common/playingEmbed')
const { Translator } = require('../common/utils');

const translations = {
    en: {
        desc: "Reload all commands",
        args: {},
    },
    uk: {
        desc: "Перезавантажити всі команди",
        args: {},
    },
};

module.exports = {
    name: "restart",
    category: "owner",
    aliases: ["reload", "рестарт"],
    arguments: [],
    translations: translations,
    ownerOnly: true,
    run: async (args, db, locale, callback, meta) => {
        try {
            meta.client.reloadCommands();
        } catch (e) {
            callback({ type: 'text', content: e.message });
            return;
        }

        callback({ type: 'react', content: '✅' });
    }
}