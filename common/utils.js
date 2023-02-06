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

module.exports = { Translator, getServerLocale }