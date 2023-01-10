const translations = {
    en: {
        desc: "Set music volume",
        args: {
            volume: "Volume (from 0 to 100)"
        },
        nothingPlaying: "❌ Queue is empty",
        specifyVolume: "Please specify volume from 0 to 100\nCurrent volume: {0}"
    },
    uk: {
        desc: "Встановити гучність музики",
        args: {
            volume: "Гучність (від 0 до 100)"
        },
        nothingPlaying: "❌ Черга порожня",
        specifyVolume: "Будь-ласка вкажіть гучність від 0 до 100\nПоточна гучність: {0}"
    },
};

module.exports = {
    name: "volume",
    aliases: ["v", "г", "гучність", "vol", "гуч", "волюм"],
    arguments: [
        {
            name: "volume",
            type: "number",
        }
    ],
    translations: translations,
    guildOnly: true,
    run: async (args, db, locale, callback, meta) => {
        if (!translations.hasOwnProperty(locale))
            locale = "en";

        const queue = meta.client.distube.getQueue(meta.message)
        if (!queue)
            return callback({ type: 'text', content: translations[locale].nothingPlaying });

        if (!args.volume || args.volume < 0 || args.volume > 100)
            return callback({ type: 'text', content: translations[locale].specifyVolume.replace("{0}", queue.volume) });

        queue.setVolume(args.volume);
        callback({ type: 'react', content: '✅' });
    }
}