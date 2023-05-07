const { owner_id } = require('../config.json');

function Translator(translations, locale) {
    this.translations = translations;
    this.locale = locale;

    return (key, ...args) => {
        if (!this.translations.hasOwnProperty(this.locale))
            this.locale = "en";
        
        const translation = this.translations[this.locale][key];

        let value = translation;

        if (typeof translation === 'string') {
            if (args.length > 0) {
                for (let i = 0; i < args.length; i += 1) {
                    value = value.replace(`{${i}}`, args[i]);
                }
            }
            return value;
        }

        if (typeof translation === 'function')
            return translation(...args);

        return translation;
    };
}

const getServerLocale = (db, guild) => {
	const sql = `SELECT * FROM locales WHERE id = ?`
	const row = db.prepare(sql).get(guild);
	return row ? row.locale : 'en';
};

const isTrusted = (db, user) => {
    if (user == owner_id)
        return true;

    const sql = `SELECT * FROM trusted WHERE user_id = ?`;
    const row = db.prepare(sql).get(user);
    return row ? true : false;
}

const makeTrusted = (db, user) => {
    const sql = `INSERT INTO trusted (user_id) VALUES (?)`;
    db.prepare(sql).run(user);
}

const untrust = (db, user) => {
    const sql = `DELETE FROM trusted WHERE user_id = ?`;
    db.prepare(sql).run(user);
}

module.exports = { Translator, getServerLocale, isTrusted, makeTrusted, untrust }