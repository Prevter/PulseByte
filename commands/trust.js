const { Translator, isTrusted, untrust, makeTrusted } = require('../common/utils');
const { owner_id } = require('../config.json');

const translations = {
    en: {
        desc: "Trusts a user to use some owner-only commands",
        args: {},
        noPerson: "You must specify a person to trust",
        trusted: "Now {0} can use owner-only commands",
        untrusted: "{0} can no longer use owner-only commands",
    },
    uk: {
        desc: "Довіряє користувачу використовувати деякі команди тільки для власника",
        args: {},
        noPerson: "Ви повинні вказати особу, яку ви хочете довірити",
        trusted: "Тепер {0} може використовувати команди тільки для власника",
        untrusted: "{0} більше не може використовувати команди тільки для власника",
    },
};

module.exports = {
    name: "trust",
    category: "owner",
    aliases: ["довірити"],
    arguments: [
        {
            name: "person",
            type: "user",
            isRequired: true,
            longString: true,
        }
    ],
    translations: translations,
    ownerOnly: true,
    run: async (args, db, locale, callback, meta) => {
        let translate = new Translator(translations, locale);

        if (meta.author.id != owner_id)
            return;

        if (!args.person) {
            callback({ type: 'text', content: translate('noPerson') })
            return;
        }

        let trusted = isTrusted(db, args.person.id);

        if (trusted) {
            untrust(db, args.person.id);
            callback({ type: 'text', content: translate('untrusted', args.person.username) });
        }
        else {
            makeTrusted(db, args.person.id);
            callback({ type: 'text', content: translate('trusted', args.person.username) });
        }
    }
}