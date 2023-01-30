const { Translator } = require('../common/utils');

const translations = {
    en: {
        desc: "Delete messages in channel",
        args: {
            amount: "Amount of messages to delete",
        },
        provideAmount: "Please provide amount of messages to delete (not more than 99)",
    },
    uk: {
        desc: "Видалити повідомлення в каналі",
        args: {
            amount: "Кількість повідомлень для видалення",
        },
        provideAmount: "Будь-ласка вкажіть кількість повідомлень для видалення (не більше 99)",
    },
};

module.exports = {
    name: "clean",
    aliases: ["cls", "clear", "клін", "клеар", "клс", "клеан", "очистити", "очистка", "прибрати"],
    arguments: [
        {
            name: "amount",
            type: "number",
            isRequired: true,
            max: 99
        }
    ],
    translations: translations,
    guildOnly: true,
    permissions: ['ManageMessages'],
    run: async (args, db, locale, callback, meta) => {
        let translate = new Translator(translations, locale);
        if (!args.amount || isNaN(args.amount)) {
            callback({ type: 'text', content: translate('provideAmount') });
            return;
        }

        if (args.amount > 99) {
            callback({ type: 'text', content: translate('provideAmount') });
            return;
        }

        try {
            await meta.message.channel.bulkDelete(args.amount + 1);
        }
        catch (e) {
            console.log(e);
            callback({ type: 'react', content: '❌' });
        }
    }
}