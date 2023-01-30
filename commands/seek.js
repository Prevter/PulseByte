const { Translator } = require('../common/utils');

const translations = {
    en: {
        desc: "Seek to a specific time in the song",
        args: {
            time: "Time to seek (for example 1:30, 30, 1:30:30)"
        },
        nothingPlaying: "❌ Queue is empty",
        invalidTime: "❌ Invalid time"
    },
    uk: {
        desc: "Перемотати на певний час в пісні",
        args: {
            time: "Час на який потрібно перемотати (наприклад 1:30, 30, 1:30:30)"
        },
        nothingPlaying: "❌ Черга порожня",
        invalidTime: "❌ Неправильний час"
    },
};

module.exports = {
    name: "seek",
    aliases: ["сік", "перемотка", "перемотати"],
    arguments: [
        {
            name: "time",
            type: "string",
            required: true,
        }
    ],
    translations: translations,
    guildOnly: true,
    run: async (args, db, locale, callback, meta) => {
        let translate = new Translator(translations, locale);

        // parse time to seconds
        if (!args.time)
            return callback({ type: 'text', content: translate('invalidTime') });

        if (args.time.split(':').length > 3) 
            return callback({ type: 'text', content: translate('invalidTime') });
        
        let time = args.time.split(':').reverse();
        let seconds = 0;
        for (let i = 0; i < time.length; i++) {
            seconds += parseInt(time[i]) * Math.pow(60, i);
        }

        if (isNaN(seconds))
            return callback({ type: 'text', content: translate('invalidTime') });

        const queue = meta.client.distube.getQueue(meta.message)
        if (!queue) return callback({ type: 'text', content: translate('nothingPlaying') });
        try {
            await queue.seek(seconds);
            callback({ type: 'react', content: '✅' });
        } catch (e) {
            console.log(e);
            callback({ type: 'react', content: '❌' });
        }
    }
}