const translations = {
    en: {
        desc: "Select repeating mode",
        args: {
            mode: "Repeat mode"
        },
        nothingPlaying: "❌ Queue is empty",
        specifyRepeat: "Please specify repeat type (off, song, queue)",
        off: "off",
        song: "song",
        queue: "queue"
    },
    uk: {
        desc: "Встановити режим повтору",
        args: {
            mode: "Тип повтору"
        },
        nothingPlaying: "❌ Черга порожня",
        specifyRepeat: "Будь-ласка вкажіть тип повтору (off (вимк), song (пісня), queue (черга))",
        off: "вимк",
        song: "пісня",
        queue: "черга"
    },
};

module.exports = {
    name: "repeat",
    aliases: ["r", "репіт", "повтор"],
    arguments: [
        {
            name: "mode",
            type: "string",
            isRequired: true,
            choices: ['off', 'song', 'queue']
        }
    ],
    translations: translations,
    guildOnly: true,
    run: async (args, db, locale, callback, meta) => {
        if (!translations.hasOwnProperty(locale))
            locale = "en";

        if (!args.mode)
            return callback({ type: 'text', content: translations[locale].specifyRepeat });

        let mode = null;

        for (const [lang, translation] of Object.entries(translations)) {
            switch (args.mode) {
                case translation.off:
                    mode = 0;
                    break;
                case translation.song:
                    mode = 1;
                    break;
                case translation.queue:
                    mode = 2;
                    break;
            }
        }

        if (!mode)
            return callback({ type: 'text', content: translations[locale].specifyRepeat });

        const queue = meta.client.distube.getQueue(meta.message)
        if (!queue) 
            return callback({ type: 'text', content: translations[locale].nothingPlaying });

        mode = queue.setRepeatMode(mode)
        callback({ type: 'react', content: '✅' });
    }
}